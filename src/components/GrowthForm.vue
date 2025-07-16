<template>
  <a-form :model="formState" :rules="rules" layout="vertical" @finish="onFinish">
    <a-row :gutter="16">
      <a-col :span="12">
        <a-form-item label="记录时间" name="time">
          <a-date-picker 
            v-model:value="formState.time" 
            :show-time="{ format: 'HH:mm' }" 
            format="YYYY-MM-DD HH:mm" 
            style="width: 100%" 
            allowClear
          />
        </a-form-item>
      </a-col>
    </a-row>
    
    <a-row :gutter="16">
      <a-col :span="12">
        <a-form-item label="体重(kg)" name="weight">
          <a-input-number 
            v-model:value="formState.weight" 
            :min="0" 
            :max="100" 
            :step="0.01" 
            style="width: 100%" 
          />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="身高(cm)" name="height">
          <a-input-number 
            v-model:value="formState.height" 
            :min="0" 
            :max="200" 
            :step="0.1" 
            style="width: 100%" 
          />
        </a-form-item>
      </a-col>
    </a-row>
    
    <a-form-item label="备注" name="notes">
      <a-textarea v-model:value="formState.notes" :rows="2" />
    </a-form-item>
    
    <a-form-item>
      <a-button type="primary" html-type="submit">提交</a-button>
    </a-form-item>
  </a-form>
</template>

<script setup>
import { reactive } from 'vue';
import dayjs from 'dayjs';

const emit = defineEmits(['add-record']);

// 表单状态
const formState = reactive({
  time: dayjs(),
  weight: 3.5,
  height: 50,
  notes: '',
});

// 表单验证规则
const rules = {
  time: [
    { required: true, message: '请选择记录时间', trigger: 'change' }
  ],
  weight: [
    { type: 'number', min: 0, max: 100, message: '体重必须在0-100kg之间', trigger: 'blur' }
  ],
  height: [
    { type: 'number', min: 0, max: 200, message: '身高必须在0-200cm之间', trigger: 'blur' }
  ]
};

// 提交表单
function onFinish() {
  const formData = {
    time: formState.time.format('YYYY-MM-DD HH:mm'),
    weight: formState.weight,
    height: formState.height,
    notes: formState.notes,
  };
  
  // 触发添加记录事件
  emit('add-record', formData);
  
  // 重置表单，但保留当前时间和默认值
  formState.time = dayjs();
  formState.weight = 3.5;
  formState.height = 50;
  formState.notes = '';
}

// 暴露方法给父组件
function submitForm() {
  onFinish();
}

defineExpose({
  submitForm
});
</script>