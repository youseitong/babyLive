<template>
  <a-form :model="formState" :rules="rules" layout="vertical" @finish="onFinish">
    <a-row :gutter="16">
      <a-col :span="12">
        <a-form-item label="排泄时间" name="time">
          <a-date-picker 
            v-model:value="formState.time" 
            :show-time="{ format: 'HH:mm' }" 
            format="YYYY-MM-DD HH:mm" 
            style="width: 100%" 
            allowClear
          />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="排泄类型" name="type">
          <a-select v-model:value="formState.type" allowClear>
            <a-select-option value="小便">小便</a-select-option>
            <a-select-option value="大便">大便</a-select-option>
            <a-select-option value="大小便">大小便</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
    </a-row>
    
    <a-row :gutter="16">
      <a-col :span="12">
        <a-form-item label="颜色" name="color" v-if="formState.type === '大便' || formState.type === '大小便'">
          <a-select v-model:value="formState.color" allowClear>
            <a-select-option value="黄色">黄色</a-select-option>
            <a-select-option value="绿色">绿色</a-select-option>
            <a-select-option value="褐色">褐色</a-select-option>
            <a-select-option value="黑色">黑色</a-select-option>
            <a-select-option value="其他">其他</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
    </a-row>
    
    <a-form-item label="备注" name="notes">
      <a-textarea v-model:value="formState.notes" :rows="2" allowClear />
    </a-form-item>
    
    <a-form-item>
      <a-button type="primary" html-type="submit">添加记录</a-button>
    </a-form-item>
  </a-form>
</template>

<script setup>
import { reactive, watch, defineExpose } from 'vue'
import dayjs from 'dayjs'

const emit = defineEmits(['add-record'])

const formState = reactive({
  time: dayjs(),
  type: '小便',
  color: '',
  notes: ''
})

// 当排泄类型改变时重置颜色
watch(() => formState.type, (newType) => {
  if (newType === '小便') {
    formState.color = ''
  } else if ((newType === '大便' || newType === '大小便') && !formState.color) {
    formState.color = '黄色'
  }
})

const rules = {
  time: [
    { required: true, message: '请选择排泄时间' }
  ],
  type: [
    { required: true, message: '请选择排泄类型' }
  ]
}

function onFinish() {
  const record = {
    time: formState.time.format('YYYY-MM-DD HH:mm'),
    type: formState.type,
    color: (formState.type === '大便' || formState.type === '大小便') ? formState.color : '',
    notes: formState.notes
  }
  
  emit('add-record', record)
  
  // 重置表单，但保留当前时间和默认值
  formState.time = dayjs()
  formState.type = '小便'
  formState.color = ''
  formState.notes = ''
}

// 暴露方法给父组件调用
function submitForm() {
  onFinish()
}

defineExpose({
  submitForm
})
</script>