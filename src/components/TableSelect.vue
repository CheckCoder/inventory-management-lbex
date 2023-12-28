<script setup lang="ts">
import { Select, type SelectProps  } from 'ant-design-vue'
import { bitable } from '@lark-base-open/js-sdk';
import { ref } from 'vue';

defineProps({
  placeholder: {
    type: String,
    default: '请选择表格'
  },
  tableId: {
    type: String,
    default: undefined
  }
})

const options = ref<SelectProps['options']>([])
bitable.base.getTableList().then(async (tableList) => {
  const list: SelectProps['options'] = []
  await Promise.all(tableList.map(async table => {
    const name = await table.getName()
    const id = table.id
    list.push({ label: name, value: id })
  }))
  options.value = list
})

</script>
<template>
  <Select :options="options" :placeholder="placeholder" :value="tableId" @change="(tableId) => $emit('update:tableId', tableId)"></Select>
</template>