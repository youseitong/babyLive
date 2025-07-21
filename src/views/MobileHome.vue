<template>
  <div class="mobile-home">
    <!-- 顶部统计卡片 -->
    <a-card class="stat-card">
      <div class="stat-header">
        <div class="stat-title">今日摄入总量</div>
        <a-tag color="blue">{{ todayDate }}</a-tag>
      </div>
      <div class="stat-value">{{ todayTotalAmount }} ml</div>
    </a-card>

    <a-card class="stat-card">
      <div class="stat-header">
        <div class="stat-title">今日排泄次数</div>
        <a-tag color="blue">{{ todayDate }}</a-tag>
      </div>
      <div class="stat-row">
        <div class="stat-item">
          <span class="stat-label">小便:</span>
          <span class="stat-value-small">{{ todayExcretionStats.pee }} 次</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">大便:</span>
          <span class="stat-value-small"
            >{{ todayExcretionStats.poop }} 次</span
          >
        </div>
      </div>
    </a-card>

    <a-card class="stat-card">
      <div class="stat-header">
        <div class="stat-title">最新身高体重</div>
        <a-tag color="blue">{{ todayDate }}</a-tag>
      </div>
      <div class="stat-row">
        <div class="stat-item">
          <span class="stat-label">体重:</span>
          <span class="stat-value-small">
            {{
              latestGrowth && latestGrowth.weight
                ? latestGrowth.weight + " kg"
                : "暂无记录"
            }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">身高:</span>
          <span class="stat-value-small">
            {{
              latestGrowth && latestGrowth.height
                ? latestGrowth.height + " cm"
                : "暂无记录"
            }}
          </span>
        </div>
      </div>
    </a-card>

    <!-- 添加记录按钮组 -->
    <div class="mobile-action-buttons" v-if="authStore.isAdmin">
      <a-button
        type="primary"
        @click="showAddModal"
        block
        style="margin-bottom: 16px; height: 48px"
      >
        <template #icon><plus-outlined /></template>
        添加吃奶/排泄记录
      </a-button>
      <a-button
        type="primary"
        @click="showAddGrowthModal"
        block
        style="
          margin-bottom: 16px;
          height: 48px;
          background-color: #722ed1;
          border-color: #722ed1;
        "
      >
        <template #icon><plus-outlined /></template>
        添加身高体重记录
      </a-button>
      <a-button
        type="primary"
        @click="addDefaultRecord"
        block
        style="
          margin-bottom: 16px;
          height: 48px;
          background-color: #52c41a;
          border-color: #52c41a;
        "
        :loading="isAddingDefault"
      >
        <template #icon><thunderbolt-outlined /></template>
        快速添加吃奶记录
      </a-button>
      <a-button
        type="default"
        @click="$router.push('/mobile/feeding-records')"
        block
        style="margin-bottom: 16px; height: 48px"
      >
        <template #icon><bar-chart-outlined /></template>
        查看吃奶记录统计
      </a-button>
    </div>

    <!-- 记录列表 -->
    <a-divider>吃奶排泄记录</a-divider>

    <!-- 移动端适配的记录列表 -->
    <div class="mobile-record-list">
      <a-list
        :data-source="sortedRecords"
        :pagination="{ pageSize: 5, size: 'small' }"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-card style="width: 100%">
              <div class="record-header">
                <div class="record-time">{{ formatTime(item.time) }}</div>
                <div class="record-tags">
                  <a-tag
                    v-if="!item.isExcretionOnly"
                    :color="getTypeColor(item.type)"
                    >{{ item.type }}</a-tag
                  >
                  <a-tag v-else color="cyan">排泄记录</a-tag>
                  <a-tag
                    v-if="item.exType"
                    :color="getExTypeColor(item.exType)"
                    >{{ item.exType }}</a-tag
                  >
                </div>
              </div>

              <div class="record-details">
                <div v-if="!item.isExcretionOnly" class="record-detail-item">
                  <span class="detail-label">吃奶量:</span>
                  <span class="detail-value">{{ item.amount }} ml</span>
                </div>
                <div v-if="!item.isExcretionOnly" class="record-detail-item">
                  <span class="detail-label">持续时间:</span>
                  <span class="detail-value">{{ item.duration }} 分钟</span>
                </div>
                <div
                  v-if="item.exType === '大便' && item.color"
                  class="record-detail-item"
                >
                  <span class="detail-label">颜色:</span>
                  <span class="detail-value">
                    <a-tag :color="getColorTag(item.color)">{{
                      item.color
                    }}</a-tag>
                  </span>
                </div>
                <div v-if="item.notes" class="record-detail-item">
                  <span class="detail-label">备注:</span>
                  <span class="detail-value">{{ item.notes }}</span>
                </div>
              </div>

              <div class="record-actions" v-if="authStore.isAdmin">
                <a-button type="link" @click="showEditModal(item)">
                  <template #icon><edit-outlined /></template>
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定要删除这条记录吗？"
                  ok-text="是"
                  cancel-text="否"
                  @confirm="deleteRecord(item.id)"
                >
                  <a-button type="link" danger>
                    <template #icon><delete-outlined /></template>
                    删除
                  </a-button>
                </a-popconfirm>
              </div>
            </a-card>
          </a-list-item>
        </template>
      </a-list>
    </div>

    <a-divider>身高体重记录</a-divider>

    <!-- 移动端适配的身高体重记录列表 -->
    <div class="mobile-record-list">
      <a-list
        :data-source="sortedGrowthRecords"
        :pagination="{ pageSize: 5, size: 'small' }"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-card style="width: 100%">
              <div class="record-header">
                <div class="record-time">{{ formatTime(item.time) }}</div>
              </div>

              <div class="record-details">
                <div class="record-detail-item">
                  <span class="detail-label">体重:</span>
                  <span class="detail-value">{{ item.weight }} kg</span>
                </div>
                <div class="record-detail-item">
                  <span class="detail-label">身高:</span>
                  <span class="detail-value">{{ item.height }} cm</span>
                </div>
                <div v-if="item.notes" class="record-detail-item">
                  <span class="detail-label">备注:</span>
                  <span class="detail-value">{{ item.notes }}</span>
                </div>
              </div>

              <div class="record-actions" v-if="authStore.isAdmin">
                <a-button type="link" @click="showEditGrowthModal(item)">
                  <template #icon><edit-outlined /></template>
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定要删除这条记录吗？"
                  ok-text="是"
                  cancel-text="否"
                  @confirm="deleteGrowthRecord(item.id)"
                >
                  <a-button type="link" danger>
                    <template #icon><delete-outlined /></template>
                    删除
                  </a-button>
                </a-popconfirm>
              </div>
            </a-card>
          </a-list-item>
        </template>
      </a-list>
    </div>

    <!-- 添加记录弹窗 -->
    <a-modal
      v-model:open="addModalVisible"
      title="添加吃奶排泄记录"
      @ok="handleAddOk"
      @cancel="handleAddCancel"
      :width="'90%'"
      :body-style="{ maxHeight: '80vh', overflowY: 'auto' }"
      :maskClosable="false"
      :footer="null"
      :keyboard="true"
      :focusTriggerAfterClose="true"
      :getContainer="false"
    >
      <mobile-feeding-form ref="feedingFormRef" @add-record="addRecord" />
    </a-modal>

    <!-- 添加身高体重记录弹窗 -->
    <a-modal
      v-model:open="addGrowthModalVisible"
      title="添加身高体重记录"
      @ok="handleAddGrowthOk"
      @cancel="handleAddGrowthCancel"
      :maskClosable="false"
      :footer="null"
      :width="'95%'"
      :keyboard="true"
      :focusTriggerAfterClose="true"
      :getContainer="false"
    >
      <growth-form ref="growthFormRef" @add-record="addGrowthRecord" />
    </a-modal>

    <!-- 编辑记录弹窗 -->
    <a-modal
      v-model:open="editModalVisible"
      title="编辑记录"
      @ok="handleEditOk"
      :width="'90%'"
      :body-style="{ maxHeight: '80vh', overflowY: 'auto' }"
      :maskClosable="false"
      :footer="null"
      :keyboard="true"
      :focusTriggerAfterClose="true"
      :getContainer="false"
    >
      <mobile-feeding-form
        ref="editFeedingFormRef"
        :initial-data="editForm"
        @add-record="updateRecord"
      />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import dayjs from "dayjs";
import { message } from "ant-design-vue";
import * as Icons from "@ant-design/icons-vue";
import { useFeedingStore } from "../stores/feeding";
import { useGrowthStore } from "../stores/growth";
import { useAuthStore } from "../stores/auth";
import MobileFeedingForm from "../components/MobileFeedingForm.vue";
import GrowthForm from "../components/GrowthForm.vue";
const { PlusOutlined, ThunderboltOutlined, EditOutlined, DeleteOutlined, BarChartOutlined } =
  Icons;

const feedingStore = useFeedingStore();
const growthStore = useGrowthStore();
const authStore = useAuthStore();

// Icons are automatically available in the template
// Refs
const editFeedingFormRef = ref(null);
const addModalVisible = ref(false);
const addGrowthModalVisible = ref(false);
const editModalVisible = ref(false);
const editForm = ref({});
const editGrowthForm = ref({});
const editGrowthModalVisible = ref(false);
const isAddingDefault = ref(false);

// Computed properties
const todayDate = computed(() => dayjs().format("YYYY-MM-DD"));
const todayTotalAmount = computed(() => {
  const today = dayjs().format("YYYY-MM-DD");
  const records = feedingStore.records || [];
  if (!Array.isArray(records)) return 0;
  return records
    .filter(
      (record) => record && dayjs(record.time).format("YYYY-MM-DD") === today
    )
    .reduce((sum, record) => sum + (parseInt(record.amount) || 0), 0);
});

const todayExcretionStats = computed(() => {
  const today = dayjs().format("YYYY-MM-DD");
  const todayRecords = (feedingStore.records || []).filter(
    (record) =>
      record &&
      record.time &&
      dayjs(record.time).format("YYYY-MM-DD") === today &&
      record.exType
  );

  return {
    pee: todayRecords.filter((r) => r && r.exType && r.exType.includes("小便"))
      .length,
    poop: todayRecords.filter((r) => r && r.exType && r.exType.includes("大便"))
      .length,
  };
});

const latestGrowth = computed(() => {
  if (!growthStore.records || !growthStore.records.length) return null;
  return growthStore.records[0]; // Assuming records are sorted by date descending
});

const sortedRecords = computed(() => {
  if (
    !feedingStore.feedingRecords ||
    !Array.isArray(feedingStore.feedingRecords)
  ) {
    return [];
  }
  return [...feedingStore.feedingRecords]
    .filter((record) => !record.deleted)
    .sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf());
});

const sortedGrowthRecords = computed(() => {
  if (!growthStore.records || !Array.isArray(growthStore.records)) {
    return [];
  }
  return [...growthStore.records].sort(
    (a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf()
  );
});

// 编辑记录
function showEditModal(record) {
  editForm.value = {
    id: record.id,
    time: record.time,
    amount: record.amount || 50,
    type: record.type || "混合",
    duration: record.duration || 5,
    exType: record.exType || "",
    color: record.color || "",
    notes: record.notes || "",
  };
  editModalVisible.value = true;
}

// 更新记录
function updateRecord(record) {
  const recordData = {
    ...record,
    id: editForm.value.id,
  };

  feedingStore
    .updateRecord(recordData)
    .then(() => {
      message.success("记录更新成功");
      editModalVisible.value = false;
    })
    .catch((error) => {
      message.error("更新记录失败: " + error.message);
    });
}

// UI Methods
function showAddModal() {
  addModalVisible.value = true;
}

function showAddGrowthModal() {
  addGrowthModalVisible.value = true;
}

function showEditGrowthModal(record) {
  editGrowthForm.value = {
    id: record.id,
    time: dayjs(record.time),
    height: record.height || 0,
    weight: record.weight || 0,
    notes: record.notes || "",
  };
  editGrowthModalVisible.value = true;
}

// Form Handlers
function handleEditOk() {
  if (editFeedingFormRef.value) {
    editFeedingFormRef.value.submitForm();
  } else {
    editModalVisible.value = false;
  }
}

function handleAddOk() {
  addModalVisible.value = false;
}

function handleAddCancel() {
  addModalVisible.value = false;
}

function handleAddGrowthOk() {
  addGrowthModalVisible.value = false;
}

function handleAddGrowthCancel() {
  addGrowthModalVisible.value = false;
}

// Helper Methods
function addRecord(record) {
  feedingStore
    .addRecord(record)
    .then(() => {
      message.success("记录添加成功");
      addModalVisible.value = false;
    })
    .catch((error) => {
      message.error("添加记录失败: " + error.message);
    });
}

function addGrowthRecord(record) {
  growthStore
    .addRecord(record)
    .then(() => {
      message.success("身高体重记录添加成功");
      addGrowthModalVisible.value = false;
    })
    .catch((error) => {
      message.error("添加记录失败: " + error.message);
    });
}

function addDefaultRecord() {
  isAddingDefault.value = true;
  const defaultRecord = {
    time: dayjs(),
    amount: 100,
    type: "混合",
    duration: 15,
    notes: "默认记录",
  };

  feedingStore.addRecord(defaultRecord).finally(() => {
    isAddingDefault.value = false;
  });
}

// Formatting Helpers
function getTypeColor(type) {
  const colors = {
    母乳: "pink",
    配方奶: "blue",
    混合: "purple",
  };
  return colors[type] || "default";
}

function getExTypeColor(exType) {
  const colors = {
    小便: "blue",
    大便: "brown",
    大小便: "orange",
  };
  return colors[exType] || "default";
}

function getColorTag(color) {
  if (!color) return null;
  return {
    color: "white",
    backgroundColor:
      color === "黄色"
        ? "#fadb14"
        : color === "绿色"
        ? "#52c41a"
        : color === "褐色"
        ? "#8b4513"
        : color === "黑色"
        ? "#000"
        : "#d3d3d3",
    border: "none",
    padding: "0 8px",
    borderRadius: "10px",
    fontSize: "12px",
  };
}

function formatTime(time) {
  return dayjs(time).format("YYYY-MM-DD HH:mm");
}

// Delete record
const deleteRecord = async (id) => {
  try {
    await feedingStore.deleteRecord(id);
    message.success('记录删除成功');
  } catch (error) {
    console.error('删除记录失败:', error);
    message.error('删除记录失败');
  }
};

// Lifecycle
onMounted(() => {
  // Load initial data from both stores
  feedingStore.loadRecords();
  growthStore.loadRecords();
});
</script>

<style scoped>
/* 统一输入控件样式 */
:deep(.ant-input),
:deep(.ant-input-search),
:deep(.ant-picker),
:deep(.ant-input-number),
:deep(.ant-select-selector) {
  height: 48px !important;
  border-radius: 8px;
  font-size: 16px;
  width: 100%;
}

/* 搜索框样式 */
:deep(.ant-input-search) {
  margin-bottom: 16px;
}

:deep(.ant-input-search .ant-input) {
  height: 48px !important;
  padding: 0 16px;
  font-size: 16px;
  border-radius: 8px 0 0 8px !important;
}

:deep(.ant-input-search-button) {
  height: 48px !important;
  width: 48px !important;
  border-radius: 0 8px 8px 0 !important;
}

:deep(.ant-input-search .ant-btn .anticon) {
  font-size: 20px;
}

:deep(.ant-picker-footer) {
  text-align: center;
}

:deep(.ant-input-number-input) {
  text-align: center;
  font-size: 16px;
  height: 40px;
}

:deep(.ant-picker-input) input {
  text-align: center;
  font-size: 16px;
  height: 40px;
}
.mobile-home {
  padding: 10px;
}

.stat-card {
  margin-bottom: 10px;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.stat-title {
  font-weight: bold;
  font-size: 16px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
}

.stat-row {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.stat-value-small {
  font-size: 18px;
  font-weight: bold;
}

.mobile-action-buttons {
  margin: 20px 0;
}

.mobile-record-list {
  margin-bottom: 20px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-time {
  font-weight: bold;
}

.record-details {
  margin: 10px 0;
}

.record-detail-item {
  display: flex;
  margin-bottom: 5px;
}

.detail-label {
  width: 80px;
  color: rgba(0, 0, 0, 0.45);
}

.record-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
}
</style>
