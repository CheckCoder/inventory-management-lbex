<script setup lang="ts">
import { Select, type SelectProps  } from 'ant-design-vue'
import { bitable } from '@lark-base-open/js-sdk';
import { ref, watch } from 'vue';

defineProps({
  placeholder: {
    type: String,
    default: '请选择表格'
  }
})

const options = ref<SelectProps['options']>([])
const currentValue = ref<SelectProps['value']>(undefined)
bitable.base.getTableList().then(async (tableList) => {
  const list: SelectProps['options'] = []
  await Promise.all(tableList.map(async table => {
    const name = await table.getName()
    const id = table.id
    list.push({ label: name, value: id })
  }))
  options.value = list
})


bitable.base.getActiveTable().then(async (table) => {
  const id = table.id
  currentValue.value = id
})

watch(currentValue, (value) => {
  console.log(value)
})

</script>
<template>
  <Select :options="options" :placeholder="placeholder" v-model:value="currentValue"></Select>
</template>