import openDb from './src/db/config.js'

async function fixDatabase() {
  try {
    const db = await openDb()
    
    // 修复吃奶记录表
    console.log('检查吃奶记录表...')
    const feedingTableInfo = await db.all("PRAGMA table_info(feeding_records)")
    console.log('吃奶记录表结构:', feedingTableInfo)
    
    // 检查是否缺少notes列
    const hasNotes = feedingTableInfo.some(col => col.name === 'notes')
    if (!hasNotes) {
      console.log('添加缺失的notes列...')
      await db.exec('ALTER TABLE feeding_records ADD COLUMN notes TEXT')
      console.log('notes列已添加')
    }
    
    // 检查是否缺少exType列
    const hasExType = feedingTableInfo.some(col => col.name === 'exType')
    if (!hasExType) {
      console.log('添加缺失的exType列...')
      await db.exec('ALTER TABLE feeding_records ADD COLUMN exType TEXT')
      console.log('exType列已添加')
    }
    
    // 检查是否缺少color列
    const hasColor = feedingTableInfo.some(col => col.name === 'color')
    if (!hasColor) {
      console.log('添加缺失的color列...')
      await db.exec('ALTER TABLE feeding_records ADD COLUMN color TEXT')
      console.log('color列已添加')
    }
    
    // 检查是否缺少created_by列
    const hasCreatedBy = feedingTableInfo.some(col => col.name === 'created_by')
    if (!hasCreatedBy) {
      console.log('添加缺失的created_by列...')
      await db.exec('ALTER TABLE feeding_records ADD COLUMN created_by TEXT')
      console.log('created_by列已添加')
    }
    
    // 检查是否缺少deleted列
    const hasDeleted = feedingTableInfo.some(col => col.name === 'deleted')
    if (!hasDeleted) {
      console.log('添加缺失的deleted列...')
      await db.exec('ALTER TABLE feeding_records ADD COLUMN deleted INTEGER DEFAULT 0')
      console.log('deleted列已添加')
    }
    
    // 修复排泄记录表
    console.log('\n检查排泄记录表...')
    
    // 首先检查表是否存在
    const tableExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='excretion_records'")
    if (!tableExists) {
      console.log('排泄记录表不存在，创建表...')
      await db.exec(`
        CREATE TABLE IF NOT EXISTS excretion_records (
          id TEXT PRIMARY KEY,
          time TEXT NOT NULL,
          type TEXT NOT NULL,
          color TEXT,
          notes TEXT
        )
      `)
      console.log('排泄记录表已创建')
    } else {
      // 检查表结构
      const excretionTableInfo = await db.all("PRAGMA table_info(excretion_records)")
      console.log('排泄记录表结构:', excretionTableInfo)
      
      // 检查是否缺少time列
      const hasTime = excretionTableInfo.some(col => col.name === 'time')
      if (!hasTime) {
        console.log('添加缺失的time列...')
        await db.exec('ALTER TABLE excretion_records ADD COLUMN time TEXT NOT NULL DEFAULT "2023-01-01 00:00"')
        console.log('time列已添加')
      }
      
      // 检查是否缺少type列
      const hasType = excretionTableInfo.some(col => col.name === 'type')
      if (!hasType) {
        console.log('添加缺失的type列...')
        await db.exec('ALTER TABLE excretion_records ADD COLUMN type TEXT NOT NULL DEFAULT "小便"')
        console.log('type列已添加')
      }
      
      // 检查是否缺少color列
      const hasExColor = excretionTableInfo.some(col => col.name === 'color')
      if (!hasExColor) {
        console.log('添加缺失的color列...')
        await db.exec('ALTER TABLE excretion_records ADD COLUMN color TEXT')
        console.log('color列已添加')
      }
      
      // 检查是否缺少notes列
      const hasExNotes = excretionTableInfo.some(col => col.name === 'notes')
      if (!hasExNotes) {
        console.log('添加缺失的notes列...')
        await db.exec('ALTER TABLE excretion_records ADD COLUMN notes TEXT')
        console.log('notes列已添加')
      }
      
      // 在fix-db.js中的排泄记录表检查部分添加以下代码
      // 检查是否缺少deleted列
      const hasDeleted = excretionTableInfo.some(col => col.name === 'deleted');
      if (!hasDeleted) {
        console.log('添加缺失的deleted列...');
        await db.exec('ALTER TABLE excretion_records ADD COLUMN deleted INTEGER DEFAULT 0');
        console.log('deleted列已添加');
      }
    }
    
    console.log('\n数据库修复完成')
  } catch (error) {
    console.error('修复数据库时出错:', error)
  }
}

fixDatabase()