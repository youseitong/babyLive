<template>
  <div class="stats">
    <h2>吃奶统计分析</h2>
    
    <feeding-stats 
      :feeding-records="feedingStore.feedingRecords" 
      :excretion-records="excretionStore.excretionRecords" 
    />
    
    <a-divider>所有记录</a-divider>
    
    <feeding-record :records="sortedRecords" @delete-record="deleteRecord" @update-record="updateRecord" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFeedingStore } from '../stores/feeding'
import { useExcretionStore } from '../stores/excretion'
import FeedingStats from '../components/FeedingStats.vue'
import FeedingRecord from '../components/FeedingRecord.vue'
import dayjs from 'dayjs'

const feedingStore = useFeedingStore()
const excretionStore = useExcretionStore()

// 修改为合并吃奶和排泄记录的计算属性
const sortedRecords = computed(() => {
  // 获取吃奶记录
  const feedingRecs = feedingStore.feedingRecords;
  
  // 获取排泄记录
  const excretionRecs = excretionStore.excretionRecords;
  
  // 创建一个时间映射，用于合并同一时间的记录
  const timeMap = new Map();
  
  // 处理吃奶记录
  feedingRecs.forEach(record => {
    const timeKey = dayjs(record.time).format('YYYY-MM-DD HH:mm');
    timeMap.set(timeKey, {
      id: record.id,
      time: record.time,
      amount: record.amount,
      type: record.type,
      duration: record.duration,
      notes: record.notes,
      exType: null,
      color: null,
      timeKey: timeKey
    });
  });
  
  // 处理排泄记录，合并到同一时间的吃奶记录中，或创建新记录
  excretionRecs.forEach(record => {
    const timeKey = dayjs(record.time).format('YYYY-MM-DD HH:mm');
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
        type: '排泄',
        duration: null,
        exType: record.type,
        color: record.color,
        notes: record.notes,
        isExcretionOnly: true,
        timeKey: timeKey
      });
    }
  });
  
  // 转换为数组并按时间排序
  return Array.from(timeMap.values()).sort((a, b) => {
    return dayjs(b.time).valueOf() - dayjs(a.time).valueOf();
  });
});

function updateRecord(id, record) {
  // 判断是否为纯排泄记录
  if (id.startsWith('ex_')) {
    // 纯排泄记录，从id中提取真实的排泄记录id
    const excretionId = id.substring(3);
    excretionStore.updateRecord(excretionId, {
      time: record.time,
      type: record.exType,
      color: record.color,
      notes: record.notes
    });
  } else if (record.excretionId) {
    // 更新吃奶记录
    feedingStore.updateRecord(id, {
      time: record.time,
      amount: record.amount,
      type: record.type,
      duration: record.duration,
      notes: record.notes
    });
    
    // 更新关联的排泄记录
    excretionStore.updateRecord(record.excretionId, {
      time: record.time,
      type: record.exType,
      color: record.color,
      notes: record.notes
    });
  } else {
    // 只更新吃奶记录
    feedingStore.updateRecord(id, record);
  }
}

function deleteRecord(id) {
  // 判断是否为纯排泄记录
  if (id.startsWith('ex_')) {
    // 纯排泄记录，从id中提取真实的排泄记录id
    const excretionId = id.substring(3);
    excretionStore.deleteRecord(excretionId);
  } else {
    // 吃奶记录
    feedingStore.deleteRecord(id);
  }
}
</script>

<style scoped>
.stats {
  width: 100%;
  margin: 0 auto;
}
</style>