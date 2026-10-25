<script setup lang="ts">
import * as d3 from "d3";
import * as topojson from "topojson-client";

import type { Constituency, CommunityWardArea } from "~/utils/constituencies";

const props = defineProps<{
    topology: any;
    object_key: string;
    assignment: Constituency[];
}>();

const emit = defineEmits<{
    (e: "mouseover", target: CommunityWardArea): void;
    (e: "mouseleave"): void;
    (e: "mousedown", target: CommunityWardArea): void;
}>();

const target = useTemplateRef<HTMLElement>("target");

const width = 500;
const height = 500;

let zoom: d3.ZoomBehavior<SVGGElement, unknown> | null = null;

const areaWardMap: Map<string, SVGPathElement[]> = new Map();
const communityWardMap: Map<string, SVGPathElement[]> = new Map();

const mappingKeyWard = (area: CommunityWardArea): string =>
    `${area.area}~${area.community}~${area.ward}`;
const mappingKeyDatum = (area: Datum): string =>
    `${area.file_name}~${area.community}~${area.name}`;

const fillMapping = new Map<string, string>();

for (const constituency of props.assignment) {
    for (const area of constituency.areas) {
        console.log(
            "adding",
            area,
            "with key",
            mappingKeyWard(area),
            "to",
            constituency.colour,
        );
        fillMapping.set(mappingKeyWard(area), constituency.colour);
    }
}

function getBaseFill(datum: Datum): string {
    return fillMapping.get(mappingKeyDatum(datum)) ?? "#dddddd";
}

/**
 * Converts a community and area into key for map
 * @param community Community Council name
 * @param area Area name (disambiguates same community in different principal areas)
 */
function mapKey(community: string, area: string): string {
    return `${community}~${area}`;
}

type Datum = {
    name: string;
    area_descr: string;
    community: string;
    file_name: string;
};

/**
 * Load a feature into the target map
 * @param topology TopoJSON topology
 * @param object Object key to load
 * @param width Width of the map area
 * @param height Height of the map area
 */
function loadTopology(
    topology: any,
    object: string,
    width: number,
    height: number,
) {
    const svg = d3.select(target.value);
    const collection = topology.objects[
        object
    ] as TopoJSON.GeometryCollection<Datum>;
    if (!collection) {
        throw `Missing property ${object} on topology`;
    }
    const feature = topojson.feature(topology, collection);

    const zoomLayer = svg.append("g");

    zoom = d3
        .zoom<SVGGElement, unknown>()
        .on("zoom", (event) => {
            zoomLayer.attr("transform", event.transform);
        })
        .scaleExtent([1, 25])
        .translateExtent([
            [0, 0],
            [width, height],
        ]);

    const extent: [[number, number], [number, number]] = [
        [0, 0],
        [width, height],
    ];

    const geoGenerator = d3
        .geoPath()
        .projection(
            d3
                .geoMercator()
                .fitExtent(extent, feature)
                .clipExtent(extent)
                .precision(0),
        )
        .digits(1);

    svg.call(zoom);

    zoomLayer
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "rgba(0, 0, 0, 0)")
        .attr("fill-opactity", "0");

    zoomLayer
        .selectAll("g")
        .data(feature.features)
        .enter()
        .append("path")
        .attr("d", geoGenerator)
        .each((feature, index, nodes) => {
            const community = feature.properties.community;
            const area = feature.properties.file_name;
            let current = nodes[index];
            if (!current) {
                console.error("Missing current for", feature);
                return;
            }

            if (!communityWardMap.has(mapKey(community, area))) {
                communityWardMap.set(mapKey(community, area), [current]);
            } else {
                communityWardMap.get(mapKey(community, area))?.push(current);
            }

            if (!areaWardMap.has(area)) {
                areaWardMap.set(area, [current]);
            } else {
                areaWardMap.get(area)?.push(current);
            }
        })
        .attr("stroke", "#1E293B")
        .attr("stroke-width", "0.01%")
        .attr("stroke-linejoin", "round")
        .attr("fill", (feature) => {
            return getBaseFill(feature.properties);
        })
        // .attr("data-ward", (feature) => feature.properties.name)
        // .attr("data-community", (feature) => feature.properties.community)
        .on("pointerenter", (event, feature) => {
            const community = feature.properties.community;
            const area = feature.properties.file_name;
            emit("mouseover", {
                ward: feature.properties.name,
                community: community,
                area: area,
            });
            const target = event.target as SVGElement | null;
            target?.setAttribute("stroke-width", "0.1%");
            target?.setAttribute("stroke", "#072f5f");

            communityWardMap
                .get(mapKey(community, area))
                ?.forEach((element) => {
                    if (element !== event.target) {
                        element.setAttribute("stroke-width", "0.05%");
                        element.setAttribute("stroke", "#4f9161");
                    }
                });

            areaWardMap.get(area)?.forEach((element) => {
                element.setAttribute("fill-opacity", "70%");
            });
        })
        .on("pointerleave", (event, feature) => {
            const community = feature.properties.community;
            const area = feature.properties.file_name;
            emit("mouseleave");
            let element = event.target as SVGElement | null;
            element?.setAttribute("stroke-width", "0.01%");
            element?.setAttribute("stroke", "#1E293B");

            communityWardMap
                .get(mapKey(community, area))
                ?.forEach((element) => {
                    if (element !== event.target) {
                        element.setAttribute("stroke-width", "0.01%");
                        element.setAttribute("stroke", "#1E293B");
                    }
                });

            areaWardMap.get(area)?.forEach((element) => {
                element.setAttribute("fill-opacity", "100%");
            });
        })
        .on("pointerdown", (_event, feature) => {
            emit("mousedown", {
                ward: feature.properties.name,
                community: feature.properties.community,
                area: feature.properties.file_name,
            });
        });
}

/**
 * Set the style for the topology based on the assignment
 * @param assignment New Assignment to colour areas by
 */
function redrawTopology(assignment: Constituency[]) {
    const svg = d3.select(target.value!);
    const zoomLayer = svg.select("g");

    fillMapping.clear();
    for (const constituency of assignment) {
        for (const area of constituency.areas) {
            fillMapping.set(mappingKeyWard(area), constituency.colour);
        }
    }

    zoomLayer
        .selectAll<HTMLElement, GeoJSON.Feature<GeoJSON.Geometry, Datum>>(
            "path",
        )
        .attr("fill", (feature) => {
            return (
                fillMapping.get(mappingKeyDatum(feature.properties)) ??
                "#dddddd"
            );
        });
}

watch(
    () => props.topology,
    () => {
        if (!props.topology) {
            console.error("Missing topology!", props.topology);
            return;
        }

        if (!props.object_key) {
            console.error("Missing object key", props.object_key);
            return;
        }

        loadTopology(props.topology, props.object_key, width, height);
    },
    { immediate: true },
);

watch(
    () => props.assignment,
    () => {
        console.log("assignment changed, redrawing", props.assignment);
        redrawTopology(props.assignment);
    },
    { deep: true },
);

onMounted(() => {
    loadTopology(props.topology, props.object_key!, width, height);
});
</script>

<template>
    <div class="w-full h-full">
        <UDropdownMenu
            :items="[
                {
                    label: 'Download PNG',
                    icon: 'i-lucide-image',
                    class: 'cursor-pointer',
                    onSelect: () => {
                        downloadPNG(target!);
                    },
                },
                {
                    label: 'Download SVG',
                    icon: 'i-lucide-vector-polygon',
                    class: 'cursor-pointer',
                    onSelect: () => {
                        downloadSVG(target!);
                    },
                },
            ]"
        >
            <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-chevron-down"
                class="cursor-pointer"
                size="xl"
                style="position: absolute; right: 1rem; top: 1rem"
            />
        </UDropdownMenu>
        <svg
            class="w-full h-full"
            ref="target"
            :viewBox="`0 0 ${width} ${height}`"
            xmlns="http://www.w3.org/2000/svg"
            @pointerleave="emit('mouseleave')"
        ></svg>
    </div>
</template>

<style scoped></style>
