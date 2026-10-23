<script setup lang="ts">
import type { SplitterItem } from '@nuxt/ui';

useSeoMeta({
  title: 'Senedd30 - Boundary Designer',
  ogTitle: 'Senedd30 - Boundary Designer',
  description: 'Design boundaries for the 16 Senedd constituencies for the 2030 Senedd Cymru election.',
  ogDescription: 'Design boundaries for the 16 Senedd constituencies for the 2030 Senedd Cymru election.',
  ogImage: 'https://example.com/image.png',
  twitterCard: 'summary_large_image',
})

const card = "bg-elevated/50 border border-default rounded-xl items-center justify-center text-muted font-medium h-full";

const items: SplitterItem[] = [
    { slot: "left", minSize: 15, defaultSize: 25, class: card },
    { slot: "main", minSize: 30, defaultSize: 75, class: card },
];

</script>

<template>
    <UApp class="h-svh">
        <UMain class="h-svh">
            <USplitter class="svh" id="app-splitter" :items=items>
                <template #left>
                    Left
                </template>
                <template #main>
                    <Map />
                </template>
            </USplitter>
        </UMain>
    </UApp>
</template>
