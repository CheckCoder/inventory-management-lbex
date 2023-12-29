<script setup lang="ts">
import { Form, FormItem, RadioGroup, RadioButton, Input, message, Spin, Button, type FormInstance } from 'ant-design-vue'
import { BarcodeOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { FieldType, bitable, IOpenSegmentType } from '@lark-base-open/js-sdk';
import type { IOpenSegment, ISingleSelectField, IOpenSingleSelect, ITextField } from '@lark-base-open/js-sdk';
import { ref, toRefs } from 'vue';
import TableSelect from '@/components/TableSelect.vue'
import FieldSelect from '@/components/FieldSelect.vue';
import { findRecord } from '@/utils/table'
import type { Rule } from 'ant-design-vue/es/form';

const formRef = ref<FormInstance>()
const form = ref<{
  tableId: string | undefined,
  codeFieldId: string | undefined,
  statusFieldId: string | undefined,
  logFieldId: string | undefined,
  mode: 'in' | 'out',
  code: string | undefined,
}>({
  tableId: undefined,
  codeFieldId: undefined,
  statusFieldId: undefined,
  logFieldId: undefined,
  mode: 'in',
  code: undefined,
})
const formRules: Record<string, Rule[]> = {
  tableId: [
    { required: true, message: '请选择仓库表格' },
  ],
  codeFieldId: [
    { required: true, message: '请选择条码字段' },
  ],
  statusFieldId: [
    { required: true, message: '请选择出入库状态字段' },
  ],
  mode: [
    { required: true, message: '请选择模式' },
  ],
  code: [
    { required: true, message: '请输入条码' },
  ],
}

const { tableId, statusFieldId, codeFieldId, logFieldId, mode, code } = toRefs(form.value)
bitable.base.getActiveTable().then(async (table) => {
  const id = table.id
  tableId.value = id
})

const loading = ref(false)
const onSubmit = async () => {
  if (loading.value) {
    message.error('正在处理上条数据中，请稍候')
    return
  }
  await formRef.value?.validate()
  loading.value = true
  try {
    await handleData()
  } catch (error) {
    message.error(String(error))
  }
  code.value = undefined
  loading.value = false
}

const handleData = async () => {
  if (!tableId.value) {
    throw new Error('请选择仓库表格')
  }
  if (!codeFieldId.value) {
    throw new Error('请选择条码字段')
  }
  if (!statusFieldId.value) {
    throw new Error('请选择出入库状态字段')
  }
  if (!code.value) {
    throw new Error('请输入条码')
  }

  const table = await bitable.base.getTableById(tableId.value)
  const codeField = await table.getFieldById<ITextField>(codeFieldId.value)
  const statusField = await table.getFieldById<ISingleSelectField>(statusFieldId.value)
  const logField = logFieldId.value ? await table.getFieldById<ITextField>(logFieldId.value) : null
  const statusOptions = await statusField.getOptions()
  let statusInOptionId: string | undefined
  let statusOutOptionId: string | undefined
  for (const option of statusOptions) {
    if (option.name === '入库') {
      statusInOptionId = option.id
    } else if (option.name === '出库') {
      statusOutOptionId = option.id
    }
  }
  if (statusInOptionId === undefined) {
    statusInOptionId = await statusField.addOption('入库')
  }
  if (statusOutOptionId === undefined) {
    statusOutOptionId = await statusField.addOption('出库')
  }

  const record = await findRecord(table, (record) => {
    if (!codeFieldId.value) {
      return false
    }
    const codeFieldValue = record.fields[codeFieldId.value] as IOpenSegment[] | null
    if (!codeFieldValue) {
      return false
    }
    if (codeFieldValue.length === 0) {
      return false
    } else if (codeFieldValue[0].text === code.value) {
      return true
    }
    return false
  })
  let recordId: string | undefined

  if (record) {
    const statusFieldValue = record.fields[statusFieldId.value] as IOpenSingleSelect || null
    if (!statusFieldValue) {
      throw new Error('存在该条码，但状态字段为空')
    }
    if (['入库', '出库'].indexOf(statusFieldValue.text) === -1) {
      throw new Error('该条码状态异常')
    }

    if (mode.value === 'in') {
      if (statusFieldValue.text === '入库') {
        throw new Error('该条码已入库，请勿重复操作')
      } else if (statusFieldValue.text === '出库') {
        await statusField.setValue(record.recordId, statusInOptionId)
      }
    } else {
      if (statusFieldValue.text === '出库') {
        throw new Error('该条码已出库，请勿重复操作')
      } else if (statusFieldValue.text === '入库') {
        await statusField.setValue(record.recordId, statusOutOptionId)
      }
    }
    recordId = record.recordId
  } else {
    if (mode.value === 'in') {
      recordId = await table.addRecord([
        await codeField.createCell(code.value),
        await statusField.createCell(statusInOptionId),
      ])
    } else {
      throw new Error('该条码不存在，无法出库')
    }
  }
  if (logField) {
    const logFieldValue = await logField.getValue(recordId)
    if (logFieldValue) {
      logField.setValue(recordId, [
        ...logFieldValue,
        {
          type: IOpenSegmentType.Text,
          text: `\n${new Date().toLocaleString()}：${mode.value === 'in' ? '入库' : '出库'}`,
        },
      ])
    } else {
      logField.setValue(recordId, [
        {
          type: IOpenSegmentType.Text,
          text: `${new Date().toLocaleString()}：${mode.value === 'in' ? '入库' : '出库'}`,
        },
      ])
    }
  }
  message.success(`${mode.value === 'in' ? '入库' : '出库'}成功`)
}

</script>
<template>
  <main class="px-5 pb-5">
    <Form :layout="'vertical'" :model="form" :rules="formRules" ref="formRef">
      <FormItem label="仓库表格" name="tableId">
        <TableSelect v-model:table-id="form.tableId"></TableSelect>
      </FormItem>
      <FormItem label="条码字段" name="codeFieldId">
        <FieldSelect v-model:table-id="form.tableId" v-model:field-id="form.codeFieldId" :field-type-list="[FieldType.Text]" placeholder="只支持文本字段">
        </FieldSelect>
      </FormItem>
      <FormItem label="出入库状态字段" name="statusFieldId">
        <FieldSelect v-model:table-id="form.tableId" v-model:field-id="form.statusFieldId"
          :field-type-list="[FieldType.SingleSelect]" placeholder="只支持单选字段"></FieldSelect>
      </FormItem>
      <FormItem label="日志字段" name="logFieldId">
        <FieldSelect v-model:table-id="form.tableId" v-model:field-id="form.logFieldId" :field-type-list="[FieldType.Text]" placeholder="只支持文本字段">
        </FieldSelect>
      </FormItem>
      <FormItem label="模式" name="mode">
        <RadioGroup v-model:value="form.mode">
          <RadioButton value="in">入库</RadioButton>
          <RadioButton value="out">出库</RadioButton>
        </RadioGroup>
      </FormItem>
      <FormItem label="条码" name="code">
        <Input placeholder="光标聚焦到此，可扫码录入" v-model:value="form.code" @press-enter="onSubmit">
        <template #suffix>
          <Spin v-if="loading" :size="'small'">
            <template #indicator>
              <LoadingOutlined class="block mt-[1px]"/>
            </template>
          </Spin>
          <BarcodeOutlined v-else class="text-gray-500" />
        </template>
        </Input>
      </FormItem>
      <FormItem>
        <div class="flex flex-row items-center">
          <Button type="primary" @click="onSubmit" :loading="loading">确认</Button>
          <div class="text-sm text-gray-400 ml-3">可在输入框按回车确认</div>
        </div>
      </FormItem>
    </Form>
  </main>
</template>
<style scoped></style>