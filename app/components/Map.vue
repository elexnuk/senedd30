<script setup lang="ts">
import { geoPath, geoMercator } from "d3-geo";
import { zoom, zoomIdentity, type D3ZoomEvent } from "d3-zoom";
import { select } from "d3-selection";
import { feature, mesh } from "topojson-client";
import rewind from "@turf/rewind";

// const emit = defineEmits(["change"]);

const width = 1250,
    height = 900;

const { data: topology } = await useFetch("/community_wards_wales.json", {
    server: false,
    deep: false,
});

// plain, non-reactive lookup of path strings by feature index
let pathById: string[] = [];
const html = shallowRef("");
const bordersD = shallowRef<string | null>(null);
const hoveredD = shallowRef<string | null>(null);
const hoveredI = shallowRef<object | null>(null);
const svgEl = ref<SVGSVGElement | null>(null);
const gEl = ref<SVGGElement | null>(null);

const wrapEl = ref<HTMLDivElement | null>(null); // outer: receives zoom events, clips
const layerEl = ref<HTMLDivElement | null>(null); // inner: gets the CSS transform

let zoomBehavior: ReturnType<typeof zoom<SVGSVGElement, unknown>> | null = null;
let currentK = 1;

watch(
    topology,
    (topo) => {
        if (!topo) return;
        const obj = "community_wards_wales";
        console.log(topo);
        console.log(obj);

        const features = feature(topo, obj);
        const path = geoPath(
            geoMercator().fitExtent(
                [
                    [0, 0],
                    [width, height],
                ],
                features,
            ),
        ); //.digits(1); // fewer decimals = much smaller DOM (d3-geo >= 3.1)

        pathById = features.features.map((f: any) => path(f) ?? "");

        // one string, one v-html: Vue creates zero vnodes for these paths
        html.value = pathById
            .map((d, i) => (d ? `<path data-i="${i}" d="${d}"/>` : ""))
            .join("");

        bordersD.value = path(mesh(topo, obj, (a: any, b: any) => a !== b));
    },
    { immediate: true },
);

onMounted(() => {
    if (!wrapEl.value || !layerEl.value) return;
    const layer = layerEl.value;

    zoomBehavior = zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 40])
        // keep the map from being dragged completely out of view
        .translateExtent([
            [0, 0],
            [width * 1.5, height * 1.5],
        ])
        .extent([
            [0, 0],
            [width * 1.5, height * 1.5],
        ])
        .on("zoom", (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
            const { x, y, k } = e.transform;
            layer.style.transform = `translate(${x}px,${y}px) scale(${k})`;
        });

    // svg.call(zoomBehavior);
    select(wrapEl.value).call(zoomBehavior);
});

onBeforeUnmount(() => {
    if (svgEl.value) select(svgEl.value).on(".zoom", null);
});

// event delegation: one listener instead of thousands
function onOver(e: PointerEvent) {
    const i = (e.target as SVGElement).dataset?.i;
    hoveredI.value =
        i !== undefined
            ? topology.value.objects.community_wards_wales.geometries[i]
                  .properties
            : null;
    hoveredD.value = i !== undefined ? pathById[+i] : null;
}
</script>

<template>
    <div ref="wrapEl" class="wrap h-full w-full">
        <UAlert
            v-if="hoveredI !== null"
            color="neutral"
            :title="hoveredI['name'] ?? 'No Community Ward'"
            :description="
                hoveredI['area_descr'] === 'COMMUNITY WARD'
                    ? `Community of ${hoveredI['community'] ?? 'No Community'}`
                    : null
            "
            class="min-w-1/4 max-w-full w-fit"
            style="position: absolute; top: 5; left: 5; z-index: 5;"
        />

        <div ref="layerEl" class="layer h-full w-full">
            <svg
                ref="svgEl"
                :viewBox="`0 0 ${width} ${height}`"
                class="topo h-full"
                @pointerover="onOver"
                @pointerleave="
                    hoveredD = null;
                    hoveredI = null;
                "
            >
                <g class="regions" v-html="html" />
                <path v-if="bordersD" :d="bordersD" class="borders" />
                <path v-if="hoveredD" :d="hoveredD" class="hover" />
            </svg>
        </div>
    </div>
</template>
<style scoped>
.wrap {
    position: relative;
    overflow: hidden;
    cursor: grab;
    touch-action: none;
}
.layer {
    transform-origin: 0 0;
    will-change: transform;
}
.topo {
    display: block;
    width: 100%;
    height: auto;
}
/* no non-scaling-stroke here: it would defeat the compositing */
.borders {
    fill: none;
    stroke: #fff;
    stroke-width: 0.5;
    pointer-events: none;
}
.hover {
    fill: #f59e0b;
    pointer-events: none;
}
</style>
