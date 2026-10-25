<script setup lang="ts">
import type { SplitterItem } from "@nuxt/ui";

import type { CommunityWardArea, Constituency } from "./utils/constituencies";
import * as d3 from "d3";

useSeoMeta({
    title: "Senedd30 - Boundary Designer",
    ogTitle: "Senedd30 - Boundary Designer",
    description:
        "Design boundaries for the 16 Senedd constituencies for the 2030 Senedd Cymru election.",
    ogDescription:
        "Design boundaries for the 16 Senedd constituencies for the 2030 Senedd Cymru election.",
    ogImage: "https://senedd30.elexn.uk/screenshot.png",
    twitterCard: "summary_large_image",
});

const card =
    "bg-elevated/50 border border-default rounded-xl text-muted font-medium h-full";

const items: SplitterItem[] = [
    { slot: "left", minSize: 15, defaultSize: 45, class: card },
    { slot: "main", minSize: 30, defaultSize: 55, class: card },
];

const {
    data: topology,
    status: topology_status,
    error: topology_error,
} = await useFetch("/community_wards_wales.json", {
    deep: false,
    server: false,
});

const topologyReady = ref(false);

const {
    data: population_csv,
    status: population_status,
    error: population_error,
} = await useFetch("/community_wards_population.csv", {
    deep: false,
    server: false,
});
const populationReady = ref(false);

const hoveredWard = reactive({
    ward: "No Ward",
    community: "No Community",
    area: "No Area",
    active: false,
});

const wardAreaKey = (area: CommunityWardArea): string =>
    `${area.area}~${area.community}~${area.ward}`;
const populationMapKey = (area: string, community: string, ward: string) =>
    `${area}~${community}~${ward}`;

const appState = reactive<{
    assignment: Constituency[];
    active: number;
    mapping: Map<string, number>;
    population: Map<string, number>;
}>({
    assignment: [],
    active: -1,
    mapping: new Map(),
    population: new Map(),
});
let nextIndex = 0;

function createConstituency() {
    appState.assignment.push({
        index: nextIndex,
        name: `Consistuency #${appState.assignment.length + 1}`,
        colour: "#d50000",
        areas: [],
    });
    if (appState.assignment.length === 1) {
        setActive(nextIndex);
    }
    nextIndex++;
}

function removeConstituency(index: number) {
    let removeIndex = appState.assignment.findIndex((c) => c.index === index);
    if (removeIndex == -1) {
        console.error(
            "Couldn't find constituency with index",
            index,
            "to remove.",
        );
        return;
    }
    appState.assignment.splice(removeIndex, 1);
    if (index === appState.active) {
        appState.active = -1;
    }
    appState.mapping.forEach((value, key) => {
        if (value === index) {
            appState.mapping.delete(key);
        }
    });
}

function setActive(index: number) {
    if (appState.assignment.find((c) => c.index === index) !== undefined) {
        appState.active = index;
    } else {
        if (index != -1) {
            console.error(
                "Couldn't set active to",
                index,
                "- couldn't find object in assignment",
            );
        }
        appState.active = -1;
    }
}

function editConstituency(index: number, name: string, colour: string) {
    const editingConstituency = appState.assignment.find(
        (c) => c.index === index,
    );
    if (editingConstituency === undefined) {
        console.error(
            "Couldn't edit constituency",
            index,
            "couldn't find object",
        );
        return;
    }

    editingConstituency.name = name;
    editingConstituency.colour = colour;
}

function addToActive(area: CommunityWardArea) {
    const activeConstituency = appState.assignment.find(
        (c) => c.index === appState.active,
    );
    if (activeConstituency === undefined) {
        console.error(
            "Couldn't add",
            area,
            "to active constituency - could't find constituency with index",
            appState.active,
        );
        return;
    }

    const key = wardAreaKey(area);
    const existing = appState.mapping.get(key);

    if (existing === appState.active) {
        return;
    }

    if (existing === undefined) {
        activeConstituency.areas.push(area);
        appState.mapping.set(key, appState.active);
        return;
    }

    const currentConstituency = appState.assignment.find(
        (c) => c.index === existing,
    );
    if (currentConstituency === undefined) {
        console.warn(
            "Couldn't find existing constituency assignment",
            existing,
            "for",
            area,
        );
    } else {
        currentConstituency.areas = currentConstituency.areas.filter(
            (other) =>
                other.area !== area.area ||
                other.community !== area.community ||
                other.ward !== area.ward,
        );
    }
    activeConstituency.areas.push(area);
    appState.mapping.set(key, appState.active);
}

watch(topology_status, () => {
    console.log("topology ready?", topology_status.value);
    if (topology_status.value !== "success") {
        topologyReady.value = false;
    } else if (topology_status.value === "success") {
        topologyReady.value = true;
        console.log("topology loaded", topologyReady);
    } else {
        console.error("Fetching topology failed", topology_error);
    }
});

watch(population_status, () => {
    console.log("population ready?", population_status.value);
    if (population_status.value !== "success") {
        populationReady.value = false;
    } else if (population_status.value === "success") {
        populationReady.value = true;
        console.log("population loaded", population_csv);

        const populationData = d3.csvParse(population_csv.value);
        if (
            !["ward", "community", "area", "population"].every((col) =>
                populationData.columns.includes(col),
            )
        ) {
            console.error("missing one of the required columns!");
            return;
        }
        for (const row of populationData) {
            const key = populationMapKey(row.area, row.community, row.ward);
            if (appState.population.has(key)) {
                console.warn(key, "already existing in population mapping?");
            }
            appState.population.set(key, parseInt(row.population));
        }
    } else {
        console.error("Fetching population failed", population_error);
    }
});
</script>

<template>
    <UApp class="h-svh">
        <UMain class="h-svh">
            <USplitter class="svh" id="app-splitter" :items="items">
                <template #left>
                    <ConstList
                        :assignment="appState.assignment"
                        :activeIndex="appState.active"
                        :population="appState.population"
                        @add="createConstituency"
                        @delete="removeConstituency"
                        @set-active="setActive"
                        @edit="editConstituency"
                    />
                </template>
                <template #main>
                    <Hovered
                        v-if="hoveredWard.active"
                        :ward="hoveredWard.ward"
                        :community="hoveredWard.community"
                        :population="
                            appState.population.get(
                                populationMapKey(
                                    hoveredWard.area,
                                    hoveredWard.community,
                                    hoveredWard.ward,
                                ),
                            )
                        "
                    />
                    <Map
                        v-if="topologyReady"
                        :topology="topology"
                        object_key="community_wards_wales"
                        :assignment="appState.assignment"
                        @mouseover="
                            (target) => {
                                hoveredWard.ward = target.ward;
                                hoveredWard.community = target.community;
                                hoveredWard.area = target.area;
                                hoveredWard.active = true;
                            }
                        "
                        @mouseleave="hoveredWard.active = false"
                        @mousedown="
                            (target) => {
                                addToActive(target);
                            }
                        "
                    />
                    <div
                        v-else
                        class="w-full h-full self-center justify-self-center place-self-center"
                    >
                        Topology Loading...
                    </div>
                </template>
            </USplitter>
        </UMain>
    </UApp>
</template>
