<template>
  <div class="feeding-record">
    <a-table
      :dataSource="records"
      :columns="isAdmin ? columns : columnsWithoutAction"
      :pagination="false"
      :scroll="{ y: 500 }"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag
            v-if="!record.isExcretionOnly"
            :color="getTypeColor(record.type)"
            >{{ record.type }}</a-tag
          >
          <a-tag v-else color="cyan">排泄记录</a-tag>
        </template>

        <template v-if="column.key === 'exType' && record.exType">
          <a-tag :color="getExTypeColor(record.exType)">{{
            record.exType
          }}</a-tag>
        </template>

        <template
          v-if="
            column.key === 'color' && record.exType === '大便' && record.color
          "
        >
          <a-tag :color="getColorTag(record.color)">{{ record.color }}</a-tag>
        </template>

        <template v-if="column.key === 'action' && isAdmin">
          <a-space>
            <a-button type="link" @click="handleEdit(record)">
              <template #icon><EditOutlined /></template>
            </a-button>
            <a-popconfirm
              title="确定要删除这条记录吗？"
              ok-text="是"
              cancel-text="否"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" danger>
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>


  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from "vue";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons-vue";
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

const emit = defineEmits(["delete-record", "edit-record"]);

const columns = [
  {
    title: "时间",
    dataIndex: "time",
    key: "time",
    // 修改为默认升序
    sorter: (a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf(),
    defaultSortOrder: "ascend",
  },
  {
    title: "类型",
    dataIndex: "type",
    key: "type",
    filters: [
      { text: "母乳", value: "母乳" },
      { text: "配方奶", value: "配方奶" },
      { text: "混合", value: "混合" },
    ],
    onFilter: (value, record) => record.type === value,
  },
  {
    title: "数量 (ml)",
    dataIndex: "amount",
    key: "amount",
    sorter: (a, b) => a.amount - b.amount,
  },
  {
    title: "持续时间 (分钟)",
    dataIndex: "duration",
    key: "duration",
  },
  {
    title: "排泄类型",
    dataIndex: "exType",
    key: "exType",
    filters: [
      { text: "小便", value: "小便" },
      { text: "大便", value: "大便" },
      { text: "大小便", value: "大小便" },
    ],
    onFilter: (value, record) => record.exType === value,
  },
  {
    title: "颜色",
    dataIndex: "color",
    key: "color",
    filters: [
      { text: "黄色", value: "黄色" },
      { text: "绿色", value: "绿色" },
      { text: "褐色", value: "褐色" },
      { text: "黑色", value: "黑色" },
      { text: "其他", value: "其他" },
    ],
    onFilter: (value, record) => record.color === value,
  },
  {
    title: "备注",
    dataIndex: "notes",
    key: "notes",
    ellipsis: true,
  },
  {
    title: "操作",
    key: "action",
  },
];
// 创建不包含操作列的列定义
const columnsWithoutAction = computed(() => {
  return columns.filter(column => column.key !== 'action');
});
const editModalVisible = ref(false);
const currentRecordId = ref(null);
const editForm = reactive({
  time: null,
  amount: 0,
  type: "",
  duration: 0,
  exType: "",
  color: "",
  notes: "",
});

// 当排泄类型改变时重置颜色
watch(
  () => editForm.exType,
  (newType) => {
    if (newType === "小便") {
      editForm.color = "";
    } else if (
      (newType === "大便" || newType === "大小便") &&
      !editForm.color
    ) {
      editForm.color = "黄色";
    }
  }
);

function getTypeColor(type) {
  switch (type) {
    case "母乳":
      return "green";
    case "配方奶":
      return "blue";
    case "混合":
      return "purple";
    default:
      return "default";
  }
}

function getExTypeColor(type) {
  switch (type) {
    case "小便":
      return "blue";
    case "大便":
      return "brown";
    case "大小便":
      return "purple";
    default:
      return "default";
  }
}

function getColorTag(color) {
  switch (color) {
    case "黄色":
      return "gold";
    case "绿色":
      return "green";
    case "褐色":
      return "brown";
    case "黑色":
      return "black";
    default:
      return "default";
  }
}

function handleEdit(record) {
  emit("edit-record", record);
}

function handleDelete(id) {
  const record = props.records.find((r) => r.id === id);
  emit("delete-record", id, record);
}
</script>
