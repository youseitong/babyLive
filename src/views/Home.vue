<template>
  <div class="home">
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="今日摄入总量" class="stat-card">
          <template #extra>
            <a-tag color="blue">{{ todayDate }}</a-tag>
          </template>
          <div class="stat-value">{{ todayTotalAmount }} ml</div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="今日排泄次数" class="stat-card">
          <template #extra>
            <a-tag color="blue">{{ todayDate }}</a-tag>
          </template>
          <div class="stat-row">
            <div class="stat-item">
              <span class="stat-label">小便:</span>
              <span class="stat-value-small"
                >{{ todayExcretionStats.pee }} 次</span
              >
            </div>
            <div class="stat-item">
              <span class="stat-label">大便:</span>
              <span class="stat-value-small"
                >{{ todayExcretionStats.poop }} 次</span
              >
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="最新身高体重" class="stat-card">
          <template #extra>
            <a-tag color="blue">{{ todayDate }}</a-tag>
          </template>
          <div class="stat-row">
            <div class="stat-item">
              <span class="stat-label">体重:</span>
              <span class="stat-value-small">{{
                latestGrowth && latestGrowth.weight
                  ? latestGrowth.weight + " kg"
                  : "暂无记录"
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">身高:</span>
              <span class="stat-value-small">{{
                latestGrowth && latestGrowth.height
                  ? latestGrowth.height + " cm"
                  : "暂无记录"
              }}</span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 添加记录按钮 -->
    <div class="add-record-button" v-if="authStore.isAdmin">
      <a-space>
        <a-button
          type="primary"
          @click="showAddModal"
          size="large"
          shape="round"
          v-if="authStore.isAdmin"
        >
          <template #icon><PlusOutlined /></template>
          添加吃奶排泄记录
        </a-button>
        <a-button
          type="primary"
          @click="showAddGrowthModal"
          size="large"
          shape="round"
          v-if="authStore.isAdmin"
          style="background-color: #722ed1; border-color: #722ed1"
        >
          <template #icon><PlusOutlined /></template>
          添加身高体重记录
        </a-button>
        <a-button
          type="primary"
          @click="addDefaultRecord"
          size="large"
          shape="round"
          v-if="authStore.isAdmin"
          style="background-color: #52c41a; border-color: #52c41a"
          :loading="isAddingDefault"
        >
          <template #icon><ThunderboltOutlined /></template>
          快速添加吃奶记录
        </a-button>
      </a-space>
    </div>

    <a-divider>吃奶排泄记录列表</a-divider>

    <feeding-record
      :records="sortedRecords"
      @delete-record="deleteRecord"
      @edit-record="showEditModal"
      :is-admin="authStore.isAdmin"
    />

    <a-divider>身高体重记录列表</a-divider>

    <growth-record
      :records="sortedGrowthRecords"
      @delete-record="deleteGrowthRecord"
      @update-record="updateGrowthRecord"
      :is-admin="authStore.isAdmin"
    />

    <!-- 添加/编辑记录弹窗 -->
    <a-modal
      v-model:visible="recordModal.visible"
      :title="recordModal.title"
      @cancel="handleRecordCancel"
      :maskClosable="false"
      :footer="null"
      width="600px"
      :destroyOnClose="true"
    >
      <feeding-form 
        ref="feedingFormRef" 
        :record-data="recordModal.recordData"
        :is-edit-mode="recordModal.isEditMode"
        @add-record="addRecord"
        @update-record="handleUpdateRecord"
        @delete-record="handleDeleteRecord"
      />
    </a-modal>
    <!-- 添加身高体重记录弹窗 -->
    <a-modal
      v-model:visible="addGrowthModalVisible"
      title="添加身高体重记录"
      @ok="handleAddGrowthOk"
      @cancel="handleAddGrowthCancel"
      :maskClosable="false"
      :footer="null"
    >
      <growth-form ref="growthFormRef" @add-record="addGrowthRecord" />
    </a-modal>
  </div>
</template>

<script setup>
import { computed, ref, reactive } from "vue";
import dayjs from "dayjs";
import { useFeedingStore } from "../stores/feeding";
import { useExcretionStore } from "../stores/excretion";
import { useGrowthStore } from "../stores/growth";
import { useAuthStore } from "../stores/auth";
import FeedingForm from "../components/FeedingForm.vue";
import GrowthForm from "../components/GrowthForm.vue";
import FeedingRecord from "../components/FeedingRecord.vue";
import GrowthRecord from "../components/GrowthRecord.vue";
import { PlusOutlined, ThunderboltOutlined, EditOutlined } from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
const feedingStore = useFeedingStore();
const excretionStore = useExcretionStore();
const growthStore = useGrowthStore();
const authStore = useAuthStore(); // 初始化认证状态管理

// 弹窗相关
// 记录弹窗状态
const recordModal = reactive({
  visible: false,
  isEditMode: false,
  title: '添加记录',
  recordData: null
});

const addGrowthModalVisible = ref(false);
const feedingFormRef = ref(null);
const growthFormRef = ref(null);

// 显示添加记录弹窗
function showAddModal() {
  recordModal.visible = true;
  recordModal.isEditMode = false;
  recordModal.title = '添加吃奶/排泄记录';
  recordModal.recordData = null;
}

// 显示编辑记录弹窗
function showEditModal(record) {
  recordModal.visible = true;
  recordModal.isEditMode = true;
  recordModal.title = '编辑记录';
  
  // 准备记录数据
  const recordData = { ...record };
  
  // 处理时间格式
  if (recordData.time) {
    recordData.time = dayjs(recordData.time);
  }
  
  // 处理排泄记录
  if (record.exType) {
    recordData.exType = record.exType;
    recordData.color = record.color || '';
  }
  
  recordModal.recordData = recordData;
}

// 处理记录弹窗取消
function handleRecordCancel() {
  recordModal.visible = false;
  recordModal.recordData = null;
}

// 处理更新记录
async function handleUpdateRecord(updatedRecord) {
  try {
    // 判断是更新吃奶记录还是排泄记录
    if (updatedRecord.amount !== null && updatedRecord.amount !== undefined) {
      await updateRecord(updatedRecord.id, updatedRecord);
    }
    if (updatedRecord.exType) {
      // 查找对应的排泄记录ID
      const excretionRecord = excretionStore.excretionRecords.find(
        r => r.time === updatedRecord.time
      );
      if (excretionRecord) {
        await excretionStore.updateRecord(excretionRecord.id, {
          time: updatedRecord.time,
          type: updatedRecord.exType,
          color: updatedRecord.color || '',
          notes: updatedRecord.notes || ''
        });
      }
    }
    
    recordModal.visible = false;
  } catch (error) {
    console.error('更新记录失败:', error);
    message.error('更新记录失败，请重试');
  }
}

// 处理删除记录
async function handleDeleteRecord(id) {
  try {
    // 判断是删除吃奶记录还是排泄记录
    if (feedingStore.feedingRecords.some(record => record.id === id)) {
      await feedingStore.deleteFeedingRecord(id);
    } else if (excretionStore.excretionRecords.some(record => record.id === id)) {
      await excretionStore.deleteExcretionRecord(id);
    }
    message.success('记录删除成功');
  } catch (error) {
    console.error('删除记录失败:', error);
    message.error('删除记录失败，请重试');
    throw error;
  }
}

// 身高体重记录相关方法
function showAddGrowthModal() {
  addGrowthModalVisible.value = true;
}

function handleAddGrowthOk() {
  // 手动触发表单提交
  if (growthFormRef.value) {
    growthFormRef.value.submitForm();
  }
}

function handleAddGrowthCancel() {
  addGrowthModalVisible.value = false;
}
const todayDate = computed(() => dayjs().format("YYYY-MM-DD"));
const todayTotalAmount = computed(() => feedingStore.todayTotalAmount);
const todayExcretionStats = computed(() => excretionStore.todayStats);
const sortedRecords = computed(() => {
  // 获取吃奶记录
  const feedingRecs = feedingStore.feedingRecords;

  // 获取排泄记录
  const excretionRecs = excretionStore.excretionRecords;

  // 创建一个时间映射，用于合并同一时间的记录
  const timeMap = new Map();

  // 处理吃奶记录
  feedingRecs.forEach((record) => {
    const timeKey = dayjs(record.time).format("YYYY-MM-DD HH:mm");
    timeMap.set(timeKey, {
      id: record.id,
      time: record.time,
      amount: record.amount,
      type: record.type,
      duration: record.duration,
      notes: record.notes,
      exType: null,
      color: null,
      timeKey: timeKey,
    });
  });

  // 处理排泄记录，合并到同一时间的吃奶记录中，或创建新记录
  excretionRecs.forEach((record) => {
    const timeKey = dayjs(record.time).format("YYYY-MM-DD HH:mm");
    if (timeMap.has(timeKey)) {
      // 合并到已有的吃奶记录
      const existingRecord = timeMap.get(timeKey);
      existingRecord.exType = record.type;
      existingRecord.color = record.color;
      // 如果排泄记录有备注，但吃奶记录没有，则使用排泄记录的备注
      if (!existingRecord.notes && record.notes) {
        existingRecord.notes = record.notes;
      }
      // 如果两者都有备注，则合并备注
      else if (existingRecord.notes && record.notes) {
        existingRecord.notes = `${existingRecord.notes}; ${record.notes}`;
      }
      // 存储排泄记录ID，用于后续更新和删除
      existingRecord.excretionId = record.id;
    } else {
      // 创建新的纯排泄记录
      timeMap.set(timeKey, {
        id: `ex_${record.id}`,
        time: record.time,
        amount: null,
        type: "排泄",
        duration: null,
        exType: record.type,
        color: record.color,
        notes: record.notes,
        isExcretionOnly: true,
        timeKey: timeKey,
      });
    }
  });

  // 转换为数组并按时间排序
  return Array.from(timeMap.values()).sort((a, b) => {
    return dayjs(b.time).valueOf() - dayjs(a.time).valueOf();
  });
});
const latestGrowth = computed(() => {
  const record = growthStore.latestRecord;
  // 确保返回一个有效的对象，即使 latestRecord 为 null
  return record || { weight: null, height: null };
});
const sortedGrowthRecords = computed(() => growthStore.sortedRecords);
async function updateRecord(id, record) {
  try {
    // 处理纯排泄记录
    if (record.isExcretionOnly) {
      const excretionId = id.replace("ex_", ""); // 移除前缀
      const excretionRecord = {
        time: record.time,
        type: record.exType,
        color: record.color,
        notes: record.notes,
      };
      await excretionStore.updateRecord(excretionId, excretionRecord);
      return;
    }

    // 更新吃奶记录
    if (record.amount !== undefined && record.type) {
      const feedingRecord = {
        time: record.time,
        amount: record.amount,
        type: record.type,
        duration: record.duration,
        notes: record.notes,
      };
      await feedingStore.updateRecord(id, feedingRecord);
    }

    // 如果有关联的排泄记录，也更新它
    if (record.excretionId && record.exType) {
      const excretionRecord = {
        time: record.time,
        type: record.exType,
        color: record.color,
        notes: record.notes,
      };
      await excretionStore.updateRecord(record.excretionId, excretionRecord);
    }
    // 如果没有关联的排泄记录，但有排泄类型，则新增一条排泄记录
    else if (record.exType) {
      const excretionRecord = {
        time: record.time,
        type: record.exType,
        color: record.color,
        notes: record.notes,
      };
      await excretionStore.addRecord(excretionRecord);
    }
  } catch (error) {
    console.error('更新记录失败:', error);
    throw error;
  }
}
function addRecord(record) {
  // 如果包含吃奶记录信息
  if (record.amount !== undefined && record.type) {
    const feedingRecord = {
      time: record.time,
      amount: record.amount,
      type: record.type,
      duration: record.duration,
      notes: record.notes,
    };
    feedingStore.addRecord(feedingRecord);
  }

  // 如果包含排泄记录信息
  if (record.exType) {
    const excretionRecord = {
      time: record.time,
      type: record.exType,
      color: record.color,
      notes: record.notes,
    };
    excretionStore.addRecord(excretionRecord);
  }

  // 添加记录后关闭弹窗
  recordModal.visible = false;
}


function deleteRecord(id) {
  // 处理纯排泄记录
  if (id.startsWith("ex_")) {
    const excretionId = id.replace("ex_", "");
    const excretionRecord = excretionStore.excretionRecords.find(r => r.id === excretionId);
    
    if (excretionRecord) {
      const timeKey = dayjs(excretionRecord.time).format("YYYY-MM-DD HH:mm");
      
      // 查找同一时间点的所有吃奶记录并删除
      const sameTimeFeedings = feedingStore.feedingRecords.filter(r => 
        dayjs(r.time).format("YYYY-MM-DD HH:mm") === timeKey
      );
      
      // 删除同一时间点的吃奶记录
      sameTimeFeedings.forEach(r => {
        feedingStore.deleteRecord(r.id);
      });
      
      // 查找同一时间点的所有其他排泄记录并删除
      const sameTimeExcretions = excretionStore.excretionRecords.filter(r => 
        dayjs(r.time).format("YYYY-MM-DD HH:mm") === timeKey &&
        r.id !== excretionId
      );
      
      // 删除同一时间点的其他排泄记录
      sameTimeExcretions.forEach(r => {
        excretionStore.deleteRecord(r.id);
      });
    }
    
    // 删除当前排泄记录
    excretionStore.deleteRecord(excretionId);
    return;
  }

  // 获取记录以检查是否有关联的排泄记录
  const record = sortedRecords.value.find((r) => r.id === id);
  
  if (record && record.timeKey) {
    const timeKey = record.timeKey;
    
    // 如果有关联的排泄记录，也删除它
    if (record.excretionId) {
      excretionStore.deleteRecord(record.excretionId);
    }
    
    // 查找同一时间点的所有排泄记录并删除
    const sameTimeExcretions = excretionStore.excretionRecords.filter(r => 
      dayjs(r.time).format("YYYY-MM-DD HH:mm") === timeKey && 
      r.id !== record.excretionId // 排除已经处理的关联排泄记录
    );
    
    // 删除同一时间点的其他排泄记录
    sameTimeExcretions.forEach(r => {
      excretionStore.deleteRecord(r.id);
    });
    
    // 查找同一时间点的所有其他吃奶记录并删除
    const sameTimeFeedings = feedingStore.feedingRecords.filter(r => 
      dayjs(r.time).format("YYYY-MM-DD HH:mm") === timeKey &&
      r.id !== id // 排除当前记录
    );
    
    // 删除同一时间点的其他吃奶记录
    sameTimeFeedings.forEach(r => {
      feedingStore.deleteRecord(r.id);
    });
  }

  // 删除当前吃奶记录
  feedingStore.deleteRecord(id);
}

// 添加身高体重记录
async function addGrowthRecord(record) {
  await growthStore.addRecord(record);
  addGrowthModalVisible.value = false;
  message.success("身高体重记录添加成功");
}

// 更新身高体重记录
async function updateGrowthRecord(id, record) {
  await growthStore.updateRecord(id, record);
  message.success("身高体重记录更新成功");
}

// 删除身高体重记录
async function deleteGrowthRecord(id) {
  await growthStore.deleteRecord(id);
  message.success("身高体重记录删除成功");
}
// 添加一个状态变量来跟踪按钮是否被禁用
const isAddingDefault = ref(false);

// 修改为异步方法
async function addDefaultRecord() {
  // 如果正在添加，则直接返回
  if (isAddingDefault.value) return;

  // 设置状态为正在添加
  isAddingDefault.value = true;

  try {
    // 创建默认记录
    const defaultRecord = {
      time: dayjs().format("YYYY-MM-DD HH:mm"),
      amount: 50,
      type: "混合",
      duration: 5,
      notes: "快速添加",
    };

    // 等待添加吃奶记录完成
    await feedingStore.addRecord(defaultRecord);

    // 显示成功提示
    message.success("已快速添加吃奶记录");
  } catch (error) {
    // 显示错误提示
    message.error("添加记录失败：" + error.message);
  } finally {
    // 无论成功还是失败，都重置状态
    isAddingDefault.value = false;
  }
}
</script>

<style scoped>
.home {
  max-width: 100%;
  margin: 0 auto;
}

.stat-card {
  margin-bottom: 16px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
}

.stat-row {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 8px;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.stat-label {
  font-weight: bold;
}

.stat-value-small {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
}

.add-record-button {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  gap: 16px;
}
</style>
