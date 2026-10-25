<script setup lang="ts">
import type { CommunityWardArea } from "~/utils/constituencies";

const props = defineProps<{
    name: string;
    colour: string;
    active: boolean;
    index: number;
    areas: CommunityWardArea[];
    population: Map<string, number>;
}>();

const emit = defineEmits<{
    (e: "active"): void;
    (e: "delete"): void;
    (e: "set-name", name: string): void;
    (e: "set-colour", colour: string): void;
}>();

const expanded = ref(false);
function toggleBody() {
    expanded.value = !expanded.value;
}

const numberFormat = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    roundingMode: "trunc",
});

const wardAreaKey = (area: CommunityWardArea): string =>
    `${area.area}~${area.community}~${area.ward}`;
const totalPopulation = computed(() => {
    return props.population
        .entries()
        .reduce((acc, [_key, value]) => acc + value, 0);
});
const quota = computed(() => {
    return totalPopulation.value / 16;
});
const minQuota = computed(() => {
    return 0.9 * quota.value;
});
const maxQuota = computed(() => {
    return 1.1 * quota.value;
});

const constituencyPopulation = computed(() => {
    return props.areas.reduce((acc, area) => {
        return acc + (props.population.get(wardAreaKey(area)) ?? 0);
    }, 0);
});
</script>

<template>
    <UCard
        class="w-full transition-all duration-75"
        :class="{ active: active }"
        :ui="{ body: 'sm:p-0 p-0' }"
    >
        <template #header>
            <div
                class="flex flex-row flex-nowrap justify-between items-center w-full cursor-pointer"
                @click="
                    () => {
                        if (!active) {
                            emit('active');
                        } else {
                            toggleBody();
                        }
                    }
                "
            >
                <span
                    class="flex flex-row space-x-1.5 justify-start items-center my-0"
                >
                    <span
                        class="text-muted text-sm pointer-events-none select-none"
                        >#{{ index }}
                    </span>
                    <ColourPicker
                        :modelValue="colour"
                        @update:modelValue="emit('set-colour', $event)"
                        @click.stop=""
                    />
                    <UInput
                        type="text"
                        color="primary"
                        variant="outline"
                        size="lg"
                        placeholder="Constituency Name"
                        class="min-w-20 max-w-80 shrink grow"
                        :modelValue="name"
                        @update:modelValue="emit('set-name', name)"
                        @click.stop=""
                    />
                </span>
                <span
                    >{{ numberFormat.format(constituencyPopulation) }} /
                    {{
                        constituencyPopulation < minQuota
                            ? "Min: " + numberFormat.format(minQuota)
                            : constituencyPopulation > maxQuota
                              ? "Max: " + numberFormat.format(maxQuota)
                              : "Quota: " + numberFormat.format(quota)
                    }}</span
                >
                <div class="space-x-4">
                    <UButton
                        @click.stop="emit('delete')"
                        class="cursor-pointer"
                        size="lg"
                        color="error"
                        variant="subtle"
                        icon="i-lucide-trash"
                    />
                    <UButton
                        @click="
                            (event) => {
                                toggleBody();
                                event.stopPropagation();
                            }
                        "
                        class="cursor-pointer"
                        size="lg"
                        variant="outline"
                        color="neutral"
                        :icon="
                            expanded
                                ? `i-lucide-chevron-up`
                                : `i-lucide-chevron-down`
                        "
                    />
                </div>
            </div>
        </template>

        <template v-if="expanded" #default>
            <UTable
                sticky
                :data="areas"
                :columns="[
                    { accessorKey: 'ward', header: 'Community Ward' },
                    { accessorKey: 'community', header: 'Community Council' },
                ]"
                class="w-full max-h-96 overflow-y-scroll"
            />
        </template>
    </UCard>
</template>

<style scoped>
.active {
    border: 0.25rem solid #334155;
}
</style>
