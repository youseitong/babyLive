<template>
  <div class="growth-record">
    <a-table
      :dataSource="records"
      :columns="isAdmin ? columns : columnsWithoutAction"
      :pagination="false"
      :scroll="{ y: 500 }"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action' && isAdmin">
          <a-space>
            <a-button
              type="primary"
              size="small"
              @click="showEditModal(record)"
            >
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除这条记录吗？"
              ok-text="是"
              cancel-text="否"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="danger" size="small">删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:visible="editModalVisible"
      title="编辑身高体重记录"
      @ok="handleEdit"
    >
      <a-form :model="editForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="记录时间">
              <a-date-picker
                v-model:value="editForm.time"
                :show-time="{ format: 'HH:mm' }"
                format="YYYY-MM-DD HH:mm"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="体重(kg)">
              <a-input-number
                v-model:value="editForm.weight"
                :min="0"
                :max="100"
                :step="0.01"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="身高(cm)">
              <a-input-number
                v-model:value="editForm.height"
                :min="0"
                :max="200"
                :step="0.1"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="备注">
          <a-textarea v-model:value="editForm.notes" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import dayjs from "dayjs";

const props = defineProps({
  records: {
    type: Array,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update-record", "delete-record"]);

// 编辑模态框
const editModalVisible = ref(false);
const editForm = reactive({
  id: "",
  time: null,
  weight: null,
  height: null,
  notes: "",
});

// 表格列配置
const columns = [
  {
    title: "记录时间",
    dataIndex: "time",
    key: "time",
    sorter: (a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf(),
  },
  {
    title: "体重 (kg)",
    dataIndex: "weight",
    key: "weight",
    sorter: (a, b) => a.weight - b.weight,
  },
  {
    title: "身高 (cm)",
    dataIndex: "height",
    key: "height",
    sorter: (a, b) => a.height - b.height,
  },
  {
    title: "备注",
    dataIndex: "notes",
    key: "notes",
  },
  {
    title: "操作",
    key: "action",
  },
];
// 创建不包含操作列的列定义
const columnsWithoutAction = computed(() => {
  return columns.filter((column) => column.key !== "action");
});
// 显示编辑模态框
function showEditModal(record) {
  editForm.id = record.id;
  editForm.time = record.time ? dayjs(record.time) : null;
  editForm.weight = record.weight;
  editForm.height = record.height;
  editForm.notes = record.notes || "";
  editModalVisible.value = true;
}

// 处理编辑操作
function handleEdit() {
  const updatedRecord = {
    id: editForm.id,
    time: editForm.time ? editForm.time.format("YYYY-MM-DD HH:mm") : null,
    weight: editForm.weight,
    height: editForm.height,
    notes: editForm.notes,
  };

  emit("update-record", editForm.id, updatedRecord);
  editModalVisible.value = false;
}

// 处理删除操作
function handleDelete(id) {
  emit("delete-record", id);
}
</script>
