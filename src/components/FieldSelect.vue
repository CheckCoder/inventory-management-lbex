<script setup lang="ts">
import { Select, type SelectProps  } from 'ant-design-vue'
import { FieldType, bitable } from '@lark-base-open/js-sdk';
import { ref, watchEffect } from 'vue';

const props = withDefaults(defineProps<{
  placeholder?: string
  tableId?: string
  fieldId?: string
  fieldTypeList?: FieldType[]
  allowClear?: boolean
}>(), {
  placeholder: '请选择字段',
})

const options = ref<SelectProps['options']>([])
watchEffect(() => {
  if (!props.tableId) return
  bitable.base.getTable(props.tableId).then(async (table) => {
    const fieldList = props.fieldTypeList ? (await Promise.all(props.fieldTypeList.map(type => table.getFieldListByType(type)))).flat() : await table.getFieldList()
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
  <Select :options="options" :placeholder="placeholder" :value="fieldId" @change="(fieldId) => $emit('update:fieldId', fieldId)" :allow-clear="allowClear"></Select>
</template>