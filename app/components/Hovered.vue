<script setup lang="ts">

const props = defineProps({
    community: { type: String },
    ward: { type: String },
    population: { type: Number, required: false }
});


const numberFormat = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    roundingMode: 'trunc',
});

</script>

<template>

    <UAlert color="neutral"
        :title="
        (population !== undefined) ? `${ward} (Population: ${numberFormat.format(population)})` : `${ward}`
        "
        :description="`Community of ${community}`"
        class="min-w-1/4 max-w-full w-fit self-start justify-self-start"
        style="position: absolute; top: 5; left: 5; z-index: 5;"
    >
    </UAlert>

</template>

<style scoped>
</style>
