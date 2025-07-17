<template>
  <a-form 
    :model="formState" 
    :rules="rules" 
    layout="vertical" 
    @finish="onFinish" 
    class="record-form"
    ref="formRef"
  >
    <!-- 记录类型选择 -->
    <a-form-item>
      <a-radio-group v-model:value="recordType" button-style="solid">
        <a-radio-button value="feeding">吃奶记录</a-radio-button>
        <a-radio-button value="excretion">排泄记录</a-radio-button>
        <a-radio-button value="both">同时记录</a-radio-button>
      </a-radio-group>
    </a-form-item>

    <a-divider style="margin: 12px 0" />

    <!-- 时间选择 -->
    <a-form-item label="时间" name="time" class="form-item">
      <a-date-picker 
        v-model:value="formState.time" 
        :show-time="{ format: 'HH:mm' }" 
        format="YYYY-MM-DD HH:mm"
        placeholder="选择时间"
        class="form-control"
        allowClear
      />
    </a-form-item>

    <!-- 吃奶记录部分 -->
    <div v-if="showFeedingSection" class="section-container">
      <h4 class="section-title">
        <span class="section-icon">🍼</span> 吃奶信息
      </h4>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="吃奶量 (ml)" name="amount" class="form-item">
            <a-input-number 
              v-model:value="formState.amount" 
              :min="0" 
              :step="10"
              placeholder="输入奶量"
              class="form-control" 
              allowClear 
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="吃奶类型" name="type" class="form-item">
            <a-select 
              v-model:value="formState.type" 
              placeholder="选择类型"
              class="form-control" 
              allowClear
            >
              <a-select-option value="母乳">母乳</a-select-option>
              <a-select-option value="配方奶">配方奶</a-select-option>
              <a-select-option value="混合">混合</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item label="持续时间 (分钟)" name="duration" class="form-item">
        <a-input-number 
          v-model:value="formState.duration" 
          :min="0" 
          placeholder="输入持续时间"
          class="form-control" 
          allowClear 
        />
      </a-form-item>
    </div>

    <!-- 排泄记录部分 -->
    <div v-if="showExcretionSection" class="section-container">
      <h4 class="section-title">
        <span class="section-icon">💩</span> 排泄信息
      </h4>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="排泄类型" name="exType" class="form-item">
            <a-select 
              v-model:value="formState.exType" 
              placeholder="选择类型"
              class="form-control"
              allowClear
            >
              <a-select-option value="小便">小便</a-select-option>
              <a-select-option value="大便">大便</a-select-option>
              <a-select-option value="大小便">大小便</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item 
            label="颜色" 
            name="color" 
            class="form-item"
            v-if="formState.exType === '大便' || formState.exType === '大小便'"
          >
            <a-select 
              v-model:value="formState.color" 
              placeholder="选择颜色"
              class="form-control"
              allowClear
            >
              <a-select-option value="黄色">黄色</a-select-option>
              <a-select-option value="绿色">绿色</a-select-option>
              <a-select-option value="褐色">褐色</a-select-option>
              <a-select-option value="黑色">黑色</a-select-option>
              <a-select-option value="其他">其他</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </div>
    
    <!-- 备注 -->
    <a-form-item label="备注" name="notes" class="form-item">
      <a-textarea 
        v-model:value="formState.notes" 
        :rows="2" 
        placeholder="添加备注信息"
        class="form-control" 
        allowClear 
      />
    </a-form-item>
    
    <!-- 操作按钮 -->
    <a-form-item class="form-actions">
      <a-space :size="16" style="width: 100%">
        <a-button 
          type="primary" 
          html-type="submit" 
          size="large"
          style="flex: 1"
          :loading="loading"
        >
          {{ isEditMode ? '更新记录' : '保存记录' }}
        </a-button>
        <a-button 
          v-if="isEditMode"
          danger
          @click="handleDelete"
          size="large"
          :loading="deleting"
        >
          删除记录
        </a-button>
      </a-space>
    </a-form-item>
  </a-form>
</template>

<script setup>
import { reactive, watch, defineExpose, ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'

const emit = defineEmits(['add-record', 'update-record', 'delete-record'])

const props = defineProps({
  recordData: {
    type: Object,
    default: () => (null)
  },
  isEditMode: {
    type: Boolean,
    default: false
  }
})

const formRef = ref(null)
const loading = ref(false)
const deleting = ref(false)
const recordType = ref('feeding') // 'feeding', 'excretion', 'both'

const formState = reactive({
  id: null,
  time: dayjs(),
  amount: 50,
  type: '混合',
  duration: 5,
  notes: '',
  exType: '',
  color: '',
  recordType: 'feeding' // 记录类型：feeding, excretion, both
})

// 计算属性控制表单显示
const showFeedingSection = computed(() => {
  return ['feeding', 'both'].includes(recordType.value)
})

const showExcretionSection = computed(() => {
  return ['excretion', 'both'].includes(recordType.value)
})

// 监听记录类型变化
watch(recordType, (newType) => {
  formState.recordType = newType
  // 重置相关字段
  if (newType === 'feeding') {
    formState.exType = ''
    formState.color = ''
  } else if (newType === 'excretion') {
    formState.amount = 0
    formState.type = ''
    formState.duration = 0
  }
})

// 当排泄类型改变时重置颜色
watch(() => formState.exType, (newType) => {
  if (newType === '小便') {
    formState.color = ''
  } else if ((newType === '大便' || newType === '大小便') && !formState.color) {
    formState.color = '黄色'
  }
})

// 表单验证规则
const rules = {
  time: [
    { required: true, message: '请选择时间' }
  ],
  amount: [
    { 
      required: showFeedingSection, 
      message: '请输入吃奶量',
      validator: (_, value) => {
        if (!showFeedingSection.value) return Promise.resolve()
        return value > 0 ? Promise.resolve() : Promise.reject('请输入有效的吃奶量')
      }
    }
  ],
  type: [
    { 
      required: showFeedingSection, 
      message: '请选择吃奶类型',
      validator: (_, value) => {
        if (!showFeedingSection.value) return Promise.resolve()
        return value ? Promise.resolve() : Promise.reject('请选择吃奶类型')
      }
    }
  ],
  exType: [
    {
      required: showExcretionSection,
      message: '请选择排泄类型',
      validator: (_, value) => {
        if (!showExcretionSection.value) return Promise.resolve()
        return value ? Promise.resolve() : Promise.reject('请选择排泄类型')
      }
    }
  ]
}

// 初始化表单数据
const initForm = () => {
  if (props.recordData) {
    const { id, time, amount, type, duration, notes, exType, color } = props.recordData
    
    // 设置记录类型
    if (amount !== undefined && amount !== null && (exType || color)) {
      recordType.value = 'both'
    } else if (amount !== undefined && amount !== null) {
      recordType.value = 'feeding'
    } else if (exType || color) {
      recordType.value = 'excretion'
    }
    
    // 设置表单值
    Object.assign(formState, {
      id: id || null,
      time: time ? dayjs(time) : dayjs(),
      amount: amount || 0,
      type: type || '混合',
      duration: duration || 0,
      notes: notes || '',
      exType: exType || '',
      color: color || '',
      recordType: recordType.value
    })
  } else {
    // 重置表单
    formState.id = null
    formState.time = dayjs()
    formState.amount = 50
    formState.type = '混合'
    formState.duration = 5
    formState.notes = ''
    formState.exType = ''
    formState.color = ''
    formState.recordType = recordType.value
  }
}

// 提交表单
async function onFinish() {
  try {
    loading.value = true
    
    // 准备记录数据
    const record = {
      id: formState.id,
      time: formState.time.format('YYYY-MM-DD HH:mm'),
      amount: showFeedingSection.value ? formState.amount : null,
      type: showFeedingSection.value ? formState.type : null,
      duration: showFeedingSection.value ? formState.duration : null,
      notes: formState.notes,
      exType: showExcretionSection.value ? formState.exType : null,
      color: showExcretionSection.value ? formState.color : null,
      recordType: recordType.value
    }
    
    // 根据是否编辑模式触发不同的事件
    if (props.isEditMode) {
      emit('update-record', record)
    } else {
      emit('add-record', record)
      // 重置表单
      formState.notes = ''
      if (recordType.value !== 'both') {
        if (recordType.value === 'feeding') {
          formState.exType = ''
          formState.color = ''
        } else {
          formState.amount = 50
          formState.type = '混合'
          formState.duration = 5
        }
      }
    }
    
    message.success(props.isEditMode ? '记录更新成功' : '记录添加成功')
    
    // 如果不是编辑模式，重置表单
    if (!props.isEditMode) {
      formState.time = dayjs()
      if (recordType.value === 'both') {
        formState.amount = 50
        formState.type = '混合'
        formState.duration = 5
        formState.exType = ''
        formState.color = ''
      }
    }
  } catch (error) {
    console.error('保存记录失败:', error)
    message.error('保存记录失败，请重试')
  } finally {
    loading.value = false
  }
}

// 删除记录
const handleDelete = () => {
  if (!formState.id) return
  
  // 显示确认对话框
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条记录吗？此操作不可恢复。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        deleting.value = true
        await emit('delete-record', formState.id)
        message.success('记录删除成功')
      } catch (error) {
        console.error('删除记录失败:', error)
        message.error('删除记录失败，请重试')
      } finally {
        deleting.value = false
      }
    },
    onCancel() {}
  })
}

// 暴露方法给父组件调用
const submitForm = async () => {
  try {
    await formRef.value.validate()
    await onFinish()
    return true
  } catch (error) {
    console.error('表单验证失败:', error)
    return false
  }
}

// 监听recordData变化
watch(() => props.recordData, (newVal) => {
  if (newVal) {
    initForm()
  }
}, { immediate: true, deep: true })

defineExpose({
  submitForm,
  form: formState
})
</script>

<style scoped>
.record-form {
  padding: 8px 4px;
}

.section-container {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.section-title {
  display: flex;
  align-items: center;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.section-icon {
  margin-right: 8px;
  font-size: 18px;
}

.form-item {
  margin-bottom: 16px;
}

.form-control {
  width: 100%;
  height: 40px;
}

:deep(.ant-input-number) {
  width: 100%;
}

:deep(.ant-input-number-input) {
  height: 38px;
}

:deep(.ant-picker) {
  width: 100%;
  height: 40px;
}

:deep(.ant-select-selector) {
  height: 40px !important;
  display: flex;
  align-items: center;
}

:deep(.ant-select-selection-item) {
  line-height: 38px !important;
}

:deep(.ant-input) {
  min-height: 40px;
  resize: none;
}

:deep(.ant-form-item-label) {
  padding: 0 0 4px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.form-actions {
  margin-top: 24px;
}

/* 单选按钮组样式 */
:deep(.ant-radio-group) {
  width: 100%;
  margin-bottom: 16px;
  display: flex;
}

:deep(.ant-radio-button-wrapper) {
  flex: 1;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .record-form {
    padding: 4px 0;
  }
  
  .section-container {
    padding: 8px;
  }
  
  :deep(.ant-form-item) {
    margin-bottom: 12px;
  }
  
  .form-actions {
    margin-top: 20px;
  }
  
  :deep(.ant-radio-button-wrapper) {
    padding: 0 8px;
    font-size: 14px;
  }
}

/* 暗黑模式适配 */
[data-theme='dark'] .section-container {
  background-color: #1f1f1f;
  border-color: #303030;
}

[data-theme='dark'] .section-title {
  color: rgba(255, 255, 255, 0.85);
}

[data-theme='dark'] :deep(.ant-form-item-label > label) {
  color: rgba(255, 255, 255, 0.85);
}

:deep(.mobile-time-picker .ant-picker-panel) {
  width: 100%;
  max-width: 100%;
}

:deep(.ant-picker-dropdown) {
  width: 90%;
  max-width: 400px;
  left: 50% !important;
  transform: translateX(-50%);
  z-index: 1100;
  position: fixed;
  top: 50%;
  transform: translate(-50%, -50%);
}

:deep(.ant-picker-time-panel-column) {
  width: 100%;
  text-align: center;
  overflow-y: auto;
  max-height: 200px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep(.ant-picker-time-panel-column)::-webkit-scrollbar {
  display: none;
}

:deep(.ant-picker-time-panel-cell-inner) {
  padding: 8px 0;
  font-size: 16px;
}

:deep(.ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner) {
  background: #e6f7ff;
  font-weight: normal;
}
</style>