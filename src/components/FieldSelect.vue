<script setup lang="ts">
import { Select, type SelectProps  } from 'ant-design-vue'
import { bitable } from '@lark-base-open/js-sdk';
import { ref, watchEffect } from 'vue';

const props = defineProps({
  placeholder: {
    type: String,
    default: '请选择字段'
  },
  tableId: {
    type: String,
    default: undefined
  },
  fieldId: {
    type: String,
    default: undefined
  }
})

const options = ref<SelectProps['options']>([])
watchEffect(() => {
  if (!props.tableId) return
  bitable.base.getTable(props.tableId).then(async (table) => {
    const fieldList = await table.getFieldList()
    const list: SelectProps['options'] = []
    await Promise.all(fieldList.map(async field => {
      const name = await field.getName()
      const id = field.id
      list.push({ label: name, value: id })
    }))

    options.value = list
  })
})

</script>
<template>
  <Select :options="options" :placeholder="placeholder" :value="fieldId" @change="(fieldId) => $emit('update:fieldId', fieldId)"></Select>
</template>