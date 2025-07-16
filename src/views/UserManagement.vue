<template>
  <div class="user-management">
    <div class="page-header">
      <h2>用户管理</h2>
      <a-button type="primary" @click="showAddUserModal">
        <template #icon><PlusOutlined /></template>
        添加用户
      </a-button>
    </div>

    <a-table :dataSource="users" :columns="columns" rowKey="id" :loading="loading">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'role'">
          <a-tag :color="record.role === 'admin' ? 'red' : 'blue'">
            {{ record.role === 'admin' ? '管理员' : '普通用户' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'created_at'">
          {{ formatDate(record.created_at) }}
        </template>
        <template v-if="column.key === 'action'">
          <a-popconfirm
            title="确定要删除此用户吗?"
            ok-text="是"
            cancel-text="否"
            @confirm="deleteUser(record.id)"
          >
            <a-button type="link" danger :disabled="record.role === 'admin' && adminCount <= 1">
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:visible="addUserModalVisible"
      title="添加用户"
      @ok="handleAddUserOk"
      @cancel="handleAddUserCancel"
      :confirmLoading="confirmLoading"
    >
      <a-form
        :model="formState"
        :rules="rules"
        ref="formRef"
        layout="vertical"
      >
        <a-form-item name="username" label="用户名">
          <a-input v-model:value="formState.username" />
        </a-form-item>
        <a-form-item name="password" label="密码">
          <a-input-password v-model:value="formState.password" />
        </a-form-item>
        <a-form-item name="role" label="角色">
          <a-select v-model:value="formState.role">
            <a-select-option value="user">普通用户</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const users = ref([]);
const loading = ref(false);
const addUserModalVisible = ref(false);
const confirmLoading = ref(false);
const formRef = ref(null);

const formState = reactive({
  username: '',
  password: '',
  role: 'user'
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
};

const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
  },
  {
    title: '操作',
    key: 'action',
  }
];

const adminCount = computed(() => {
  return users.value.filter(user => user.role === 'admin').length;
});

const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

const loadUsers = async () => {
  loading.value = true;
  try {
    users.value = await authStore.getUsers();
  } catch (error) {
    message.error('加载用户列表失败');
  } finally {
    loading.value = false;
  }
};

const showAddUserModal = () => {
  addUserModalVisible.value = true;
};

const handleAddUserOk = () => {
  formRef.value.validate().then(async () => {
    confirmLoading.value = true;
    try {
      await authStore.registerUser(formState.username, formState.password, formState.role);
      message.success('用户添加成功');
      addUserModalVisible.value = false;
      formRef.value.resetFields();
      loadUsers();
    } catch (error) {
      message.error(error.message || '添加用户失败');
    } finally {
      confirmLoading.value = false;
    }
  });
};

const handleAddUserCancel = () => {
  addUserModalVisible.value = false;
  formRef.value.resetFields();
};

const deleteUser = async (userId) => {
  try {
    await authStore.deleteUser(userId);
    message.success('用户删除成功');
    loadUsers();
  } catch (error) {
    message.error(error.message || '删除用户失败');
  }
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>