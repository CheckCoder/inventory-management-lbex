<script setup lang="ts">
import TableSelect from '@/components/TableSelect.vue'
import { Form, FormItem } from 'ant-design-vue'

</script>
<template>
  <main class="px-5 pb-5">
    <Form>
      <FormItem label="仓库表格">
        <TableSelect></TableSelect>
      </FormItem>
    </Form>
  </main>
</template>
<style scoped>
</style>