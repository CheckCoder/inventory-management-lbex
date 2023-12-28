<script setup lang="ts">
import TableSelect from '@/components/TableSelect.vue'
import { Form, FormItem } from 'ant-design-vue'
import { bitable } from '@lark-base-open/js-sdk';
import { ref } from 'vue';

const tableId = ref<string | undefined>(undefined)
bitable.base.getActiveTable().then(async (table) => {
  const id = table.id
  tableId.value = id
})

</script>
<template>
  <main class="px-5 pb-5">
    <Form>
      <FormItem label="仓库表格">
        <TableSelect v-model:table-id="tableId"></TableSelect>
      </FormItem>
    </Form>
  </main>
</template>
<style scoped>
</style>