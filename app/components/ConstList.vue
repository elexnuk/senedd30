<script setup lang="ts">
import type { Constituency } from "~/utils/constituencies";

const props = defineProps<{
    assignment: Constituency[];
    activeIndex: number;
    population: Map<string, number>;
}>();

const emit = defineEmits<{
    (e: "add"): void;
    (e: "delete", index: number): void;
    (e: "set-active", index: number): void;
    (e: "edit", index: number, name: string, colour: string): void;
}>();

</script>

<template>
    <div class="flex-col w-full h-full space-y-2 overflow-y-scroll">
        <UHeader class="w-full" title="Senedd 30">
            <template #right>
                <div class="flex flex-row items-center justify-end gap-4">
                    <span class="pointer-events-auto select-none"
                        >{{ assignment.length }} / 16</span
                    >
                    <UButton
                        icon="i-lucide-plus"
                        size="lg"
                        color="primary"
                        class="cursor-pointer"
                        @click="emit('add')"
                    ></UButton>
                    <UButton
                        @click="emit('set-active', -1)"
                        icon="i-lucide-eye"
                        color="neutral"
                        class="cursor-pointer"
                        :class="{ 'btn-active': activeIndex == -1 }"
                        variant="outline"
                        size="lg"
                    ></UButton>
                </div>
            </template>
        </UHeader>
        <div class="px-2 h-full" @click="emit('set-active', -1)">
            <div class="space-y-2">
                <UEmpty
                    v-if="assignment.length == 0"
                    title="No Constituencies"
                    variant="subtle"
                    description="Add a new constituency to get started drawing your boundaries."
                    :actions="[
                        {
                            icon: 'i-lucide-plus',
                            label: 'Add Constituency',
                            class: 'cursor-pointer',
                            onClick: () => {
                                emit('add');
                            },
                        },
                    ]"
                />
                <ConstItem
                    v-for="(constituency, index) in assignment"
                    :key="constituency.index"
                    :index="index + 1"
                    :name="constituency.name"
                    :colour="constituency.colour"
                    :areas="constituency.areas"
                    :active="activeIndex === constituency.index"
                    :population="population"
                    @set-name="
                        (name) => {
                            emit(
                                'edit',
                                constituency.index,
                                name,
                                constituency.colour,
                            );
                        }
                    "
                    @set-colour="
                        (colour) => {
                            emit(
                                'edit',
                                constituency.index,
                                constituency.name,
                                colour,
                            );
                        }
                    "
                    @delete="emit('delete', constituency.index)"
                    @active="emit('set-active', constituency.index)"
                    @click.stop=""
                />
                <USeparator v-if="assignment.length != 0" class="my-4" />
                <div
                    class="w-full flex flex-row items-center justify-center space-x-4"
                    v-if="assignment.length != 0"
                >
                    <UButton
                        @click.stop="emit('add')"
                        icon="i-lucide-plus"
                        class="cursor-pointer"
                        size="lg"
                        >Add Constituency</UButton
                    >
                    <UButton
                        @click=""
                        icon="i-lucide-eye"
                        color="neutral"
                        class="cursor-pointer"
                        :class="{ 'btn-active': activeIndex == -1 }"
                        variant="outline"
                        size="lg"
                        >View</UButton
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.btn-active {
    border: 0.1rem solid #334155;
}
</style>
