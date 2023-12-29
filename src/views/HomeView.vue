<script setup lang="ts">
import TableSelect from '@/components/TableSelect.vue'
import FieldSelect from '@/components/FieldSelect.vue';
import { Form, FormItem, RadioGroup, RadioButton, Input } from 'ant-design-vue'
import { FieldType, bitable } from '@lark-base-open/js-sdk';
import { ref } from 'vue';
import { findRecord } from '@/utils/table'

const tableId = ref<string | undefined>(undefined)
bitable.base.getActiveTable().then(async (table) => {
  const id = table.id
  tableId.value = id
})

const codeFieldId = ref<string | undefined>(undefined)
const statusFieldId = ref<string | undefined>(undefined)
const logFieldId = ref<string | undefined>(undefined)
const mode = ref<'in' | 'out'>('in')
const code = ref<string | undefined>(undefined)

const handleData = async () => {
  if (!tableId.value) {
    return
  }
  if (!codeFieldId.value) {
    return
  }
  if (!statusFieldId.value) {
    return
  }
  if (!code.value) {
    return
  }

  const record = await findRecord(tableId.value, (record) => {
    if (!codeFieldId.value) {
      return false
    }

    const codeField = record.fields[codeFieldId.value] as any
    if (codeField?.text === code.value) {
      return true
    } else if (codeField?.[0]?.text === code.value) {
      return true
    }
    return false
  })
  console.log(record)
}

</script>
<template>
  <main class="px-5 pb-5">
    <Form>
      <FormItem label="仓库表格">
        <TableSelect v-model:table-id="tableId"></TableSelect>
      </FormItem>
      <FormItem label="条码字段">
        <FieldSelect v-model:table-id="tableId" v-model:field-id="codeFieldId" :field-type-list="[FieldType.Text]"></FieldSelect>
      </FormItem>
      <FormItem label="出入库状态字段">
        <FieldSelect v-model:table-id="tableId" v-model:field-id="statusFieldId" :field-type-list="[FieldType.SingleSelect]"></FieldSelect>
      </FormItem>
      <FormItem label="日志字段">
        <FieldSelect v-model:table-id="tableId" v-model:field-id="logFieldId" :field-type-list="[FieldType.Text]"></FieldSelect>
      </FormItem>
      <FormItem label="模式">
        <RadioGroup v-model:value="mode">
          <RadioButton value="in">入库</RadioButton>
          <RadioButton value="out">出库</RadioButton>
        </RadioGroup>
      </FormItem>
      <FormItem label="条码">
        <Input placeholder="光标聚焦到此，可扫码录入" v-model:value="code" @press-enter="handleData"/>
      </FormItem>
    </Form>
  </main>
</template>
<style scoped>
</style>