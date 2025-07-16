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
          <span class="stat-value-small">{{ todayExcretionStats.poop }} 次</span>
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
            {{ latestGrowth && latestGrowth.weight ? latestGrowth.weight + " kg" : "暂无记录" }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">身高:</span>
          <span class="stat-value-small">
            {{ latestGrowth && latestGrowth.height ? latestGrowth.height + " cm" : "暂无记录" }}
          </span>
        </div>
      </div>
    </a-card>

    <!-- 添加记录按钮组 -->
    <div class="mobile-action-buttons" v-if="authStore.isAdmin">
      <a-button 
        type="primary" 
        block 
        @click="showAddModal" 
        size="large"
      >
        <template #icon><PlusOutlined /></template>
        添加吃奶排泄记录
      </a-button>
      
      <a-button 
        type="primary" 
        block 
        @click="showAddGrowthModal" 
        size="large"
        style="background-color: #722ed1; border-color: #722ed1; margin-top: 10px;"
      >
        <template #icon><PlusOutlined /></template>
        添加身高体重记录
      </a-button>
      
      <a-button 
        type="primary" 
        block 
        @click="addDefaultRecord" 
        size="large"
        style="background-color: #52c41a; border-color: #52c41a; margin-top: 10px;"
        :loading="isAddingDefault"
      >
        <template #icon><ThunderboltOutlined /></template>
        快速添加吃奶记录
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
                  <a-tag v-if="!item.isExcretionOnly" :color="getTypeColor(item.type)">{{ item.type }}</a-tag>
                  <a-tag v-else color="cyan">排泄记录</a-tag>
                  <a-tag v-if="item.exType" :color="getExTypeColor(item.exType)">{{ item.exType }}</a-tag>
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
                <div v-if="item.exType === '大便' && item.color" class="record-detail-item">
                  <span class="detail-label">颜色:</span>
                  <span class="detail-value">
                    <a-tag :color="getColorTag(item.color)">{{ item.color }}</a-tag>
                  </span>
                </div>
                <div v-if="item.notes" class="record-detail-item">
                  <span class="detail-label">备注:</span>
                  <span class="detail-value">{{ item.notes }}</span>
                </div>
              </div>
              
              <div class="record-actions" v-if="authStore.isAdmin">
                <a-button type="link" @click="showEditModal(item)">
                  <template #icon><EditOutlined /></template>
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定要删除这条记录吗？"
                  ok-text="是"
                  cancel-text="否"
                  @confirm="deleteRecord(item.id)"
                >
                  <a-button type="link" danger>
                    <template #icon><DeleteOutlined /></template>
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
                  <template #icon><EditOutlined /></template>
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定要删除这条记录吗？"
                  ok-text="是"
                  cancel-text="否"
                  @confirm="deleteGrowthRecord(item.id)"
                >
                  <a-button type="link" danger>
                    <template #icon><DeleteOutlined /></template>
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
      v-model:visible="addModalVisible"
      title="添加吃奶排泄记录"
      @ok="handleAddOk"
      @cancel="handleAddCancel"
      :maskClosable="false"
      :footer="null"
      :width="'95%'"
    >
      <feeding-form ref="feedingFormRef" @add-record="addRecord" />
    </a-modal>
    
    <!-- 添加身高体重记录弹窗 -->
    <a-modal
      v-model:visible="addGrowthModalVisible"
      title="添加身高体重记录"
      @ok="handleAddGrowthOk"
      @cancel="handleAddGrowthCancel"
      :maskClosable="false"
      :footer="null"
      :width="'95%'"
    >
      <growth-form ref="growthFormRef" @add-record="addGrowthRecord" />
    </a-modal>

    <!-- 编辑记录弹窗 -->
    <a-modal
      v-model:visible="editModalVisible"
      title="编辑记录"
      @ok="handleEdit"
      :width="'95%'"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="吃奶时间">
          <a-date-picker
            v-model:value="editForm.time"
            :show-time="{ format: 'HH:mm' }"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="吃奶量 (ml)">
          <a-input-number
            v-model:value="editForm.amount"
            :min="0"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="吃奶类型">
          <a-select v-model:value="editForm.type" style="width: 100%">
            <a-select-option value="母乳">母乳</a-select-option>
            <a-select-option value="配方奶">配方奶</a-select-option>
            <a-select-option value="混合">混合</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="持续时间 (分钟)">
          <a-input-number
            v-model:value="editForm.duration"
            :min="0"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="排泄类型">
          <a-select v-model:value="editForm.exType" allowClear style="width: 100%">
            <a-select-option value="小便">小便</a-select-option>
            <a-select-option value="大便">大便</a-select-option>
            <a-select-option value="大小便">大小便</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="颜色"
          v-if="editForm.exType === '大便' || editForm.exType === '大小便'"
        >
          <a-select v-model:value="editForm.color" allowClear style="width: 100%">
            <a-select-option value="黄色">黄色</a-select-option>
            <a-select-option value="绿色">绿色</a-select-option>
            <a-select-option value="褐色">褐色</a-select-option>
            <a-select-option value="黑色">黑色</a-select-option>
            <a-select-option value="其他">其他</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="备注">
          <a-textarea v-model:value="editForm.notes" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑身高体重记录弹窗 -->
    <a-modal
      v-model:visible="editGrowthModalVisible"
      title="编辑身高体重记录"
      @ok="handleEditGrowth"
      :width="'95%'"
    >
      <a-form :model="editGrowthForm" layout="vertical">
        <a-form-item label="记录时间">
          <a-date-picker
            v-model:value="editGrowthForm.time"
            :show-time="{ format: 'HH:mm' }"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="体重 (kg)">
          <a-input-number
            v-model:value="editGrowthForm.weight"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="身高 (cm)">
          <a-input-number
            v-model:value="editGrowthForm.height"
            :min="0"
            :precision="1"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="备注">
          <a-textarea v-model:value="editGrowthForm.notes" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import dayjs from "dayjs";
import { useFeedingStore } from "../stores/feeding";
import { useExcretionStore } from "../stores/excretion";
import { useGrowthStore } from "../stores/growth";
import { useAuthStore } from "../stores/auth";
import FeedingForm from "../components/FeedingForm.vue";
import GrowthForm from "../components/GrowthForm.vue";
import { PlusOutlined, ThunderboltOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

const feedingStore = useFeedingStore();
const excretionStore = useExcretionStore();
const growthStore = useGrowthStore();
const authStore = useAuthStore();

// 弹窗相关
const addModalVisible = ref(false);
const addGrowthModalVisible = ref(false);
const editModalVisible = ref(false);
const editGrowthModalVisible = ref(false);
const feedingFormRef = ref(null);
const growthFormRef = ref(null);
const isAddingDefault = ref(false);

// 编辑表单数据
const editForm = ref({
  id: null,
  time: null,
  amount: 0,
  type: "母乳",
  duration: 0,
  exType: null,
  color: null,
  notes: "",
});

const editGrowthForm = ref({
  id: null,
  time: null,
  weight: 0,
  height: 0,
  notes: "",
});

// 计算属性
const todayDate = computed(() => dayjs().format("YYYY-MM-DD"));
const todayTotalAmount = computed(() => feedingStore.todayTotalAmount);
const todayExcretionStats = computed(() => excretionStore.todayStats);
const latestGrowth = computed(() => {
  if (growthStore.growthRecords.length > 0) {
    return growthStore.sortedRecords[0];
  }
  return null;
});

const sortedRecords = computed(() => {
  // 获取吃奶记录
  const feedingRecs = feedingStore.feedingRecords;

  // 获取排泄记录
  const excretionRecs = excretionStore.excretionRecords;

  // 创建一个时间映射，用于合并同一时间的记录
  const timeMap = new Map();

  // 处理吃奶记录
  feedingRecs.forEach((record) => {
    const key = record.time;
    if (!timeMap.has(key)) {
      timeMap.set(key, { ...record, isExcretionOnly: false });
    }
  });

  // 处理排泄记录，如果同一时间有吃奶记录，则合并；否则创建新记录
  excretionRecs.forEach((record) => {
    const key = record.time;
    if (timeMap.has(key)) {
      // 合并记录
      const existingRecord = timeMap.get(key);
      timeMap.set(key, {
        ...existingRecord,
        exType: record.type,
        color: record.color,
        notes: record.notes || existingRecord.notes,
      });
    } else {
      // 创建新的排泄记录
      timeMap.set(key, {
        id: record.id,
        time: record.time,
        exType: record.type,
        color: record.color,
        notes: record.notes,
        isExcretionOnly: true,
      });
    }
  });

  // 转换为数组并按时间排序（最新的在前）
  return Array.from(timeMap.values()).sort((a, b) =>
    dayjs(b.time).valueOf() - dayjs(a.time).valueOf()
  );
});

const sortedGrowthRecords = computed(() => {
  return growthStore.sortedRecords;
});

// 方法
function showAddModal() {
  addModalVisible.value = true;
}

function showAddGrowthModal() {
  addGrowthModalVisible.value = true;
}

function handleAddOk() {
  if (feedingFormRef.value) {
    feedingFormRef.value.submitForm();
  }
}

function handleAddGrowthOk() {
  if (growthFormRef.value) {
    growthFormRef.value.submitForm();
  }
}

function handleAddCancel() {
  addModalVisible.value = false;
}

function handleAddGrowthCancel() {
  addGrowthModalVisible.value = false;
}

function addRecord(record) {
  feedingStore.addRecord(record);
  addModalVisible.value = false;
  message.success("记录添加成功");
}

function addGrowthRecord(record) {
  growthStore.addRecord(record);
  addGrowthModalVisible.value = false;
  message.success("身高体重记录添加成功");
}

function addDefaultRecord() {
  isAddingDefault.value = true;
  const now = dayjs().format("YYYY-MM-DD HH:mm");
  const defaultRecord = {
    time: now,
    amount: 120,
    type: "母乳",
    duration: 15,
    exType: "小便",
    color: null,
    notes: "快速添加",
  };

  feedingStore.addRecord(defaultRecord)
    .then(() => {
      message.success("快速添加记录成功");
      isAddingDefault.value = false;
    })
    .catch((error) => {
      message.error("添加失败: " + error.message);
      isAddingDefault.value = false;
    });
}

function showEditModal(record) {
  editForm.value = {
    id: record.id,
    time: dayjs(record.time),
    amount: record.amount || 0,
    type: record.type || "母乳",
    duration: record.duration || 0,
    exType: record.exType || null,
    color: record.color || null,
    notes: record.notes || "",
  };
  editModalVisible.value = true;
}

function showEditGrowthModal(record) {
  editGrowthForm.value = {
    id: record.id,
    time: dayjs(record.time),
    weight: record.weight || 0,
    height: record.height || 0,
    notes: record.notes || "",
  };
  editGrowthModalVisible.value = true;
}

function handleEdit() {
  const updatedRecord = {
    ...editForm.value,
    time: dayjs(editForm.value.time).format("YYYY-MM-DD HH:mm"),
  };
  
  feedingStore.updateRecord(updatedRecord.id, updatedRecord)
    .then(() => {
      message.success("记录更新成功");
      editModalVisible.value = false;
    })
    .catch((error) => {
      message.error("更新失败: " + error.message);
    });
}

function handleEditGrowth() {
  const updatedRecord = {
    ...editGrowthForm.value,
    time: dayjs(editGrowthForm.value.time).format("YYYY-MM-DD HH:mm"),
  };
  
  growthStore.updateRecord(updatedRecord.id, updatedRecord)
    .then(() => {
      message.success("身高体重记录更新成功");
      editGrowthModalVisible.value = false;
    })
    .catch((error) => {
      message.error("更新失败: " + error.message);
    });
}

function deleteRecord(id) {
  feedingStore.deleteRecord(id)
    .then(() => {
      message.success("记录删除成功");
    })
    .catch((error) => {
      message.error("删除失败: " + error.message);
    });
}

function deleteGrowthRecord(id) {
  growthStore.deleteRecord(id)
    .then(() => {
      message.success("身高体重记录删除成功");
    })
    .catch((error) => {
      message.error("删除失败: " + error.message);
    });
}

function formatTime(time) {
  return dayjs(time).format("YYYY-MM-DD HH:mm");
}

function getTypeColor(type) {
  switch (type) {
    case "母乳":
      return "pink";
    case "配方奶":
      return "blue";
    case "混合":
      return "purple";
    default:
      return "default";
  }
}

function getExTypeColor(exType) {
  switch (exType) {
    case "小便":
      return "gold";
    case "大便":
      return "brown";
    case "大小便":
      return "orange";
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
</script>

<style scoped>
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