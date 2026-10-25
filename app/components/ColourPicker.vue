<script setup lang="ts">
const model = defineModel<string>({ default: '#FAA61A' });
const FULL_HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const PARTIAL_HEX = /^#?[0-9a-f]{0,6}$/i;

function normalise(value: string): string | null {
  const match = value.trim().match(FULL_HEX)
  if (!match) return null

  let hex = match[1]!.toUpperCase()
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }
  return `#${hex}`
}

const text = ref(model.value)
const invalid = computed(() => !PARTIAL_HEX.test(text.value.trim()))

watch(model, (value) => {
  if (normalise(text.value) !== value) {
    text.value = value
  }
})

watch(text, (value) => {
  const trimmed = value.trim()
  if (/^#?[0-9a-f]{6}$/i.test(trimmed)) {
    const next = normalise(trimmed)
    if (next && next !== model.value) model.value = next
  }
})

function commit() {
  const next = normalise(text.value)
  if (next) {
    model.value = next
    text.value = next
  } else {
    text.value = model.value
  }
}
</script>

<template>
    <UPopover>
        <span
            @click.stop=""
            class="size-9 rounded-full ring-1 ring-inset ring-accented focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :style="{ backgroundColor: model }"
        >
        </span>

        <template #content>
            <UColorPicker
                v-model="model"
                class="p-2"
                size="xl"
            />
            <UInput
                class="w-full"
                v-model="text"
                maxlength="7"
                autocomplete="off"
                spellcheck="false"
                @blur="commit"
                @keydown.enter.prevent="commit"
                :highlight="invalid"
                :color="invalid ? 'error' : 'primary'"
                size="lg"
            />
        </template>
    </UPopover>
</template>

<style scoped></style>
