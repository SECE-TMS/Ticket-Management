import { TasksListPage } from './shared/TasksListPage'
import { TaskDetailPage } from './shared/TaskDetailPage'

export function AdminTasks() {
  return (
    <TasksListPage
      title="Task Assignments &amp; Work Orders"
      description="Create, assign, and track specific technician tasks across all campus departments."
      detailBase="/admin/tasks"
    />
  )
}

export function AdminTaskDetail() {
  return <TaskDetailPage backTo="/admin/tasks" />
}

export function ManagerTasks() {
  return (
    <TasksListPage
      title="Department Task Assignments"
      description="Assign specific work instructions, deadlines, and checklists to your department staff."
      detailBase="/manager/tasks"
    />
  )
}

export function ManagerTaskDetail() {
  return <TaskDetailPage backTo="/manager/tasks" />
}

export function EmployeeTasks() {
  return (
    <TasksListPage
      title="My Assigned Tasks"
      description="View your specific work orders, check off subtask checklists, and complete tasks with photo proof."
      detailBase="/employee/tasks"
    />
  )
}

export function EmployeeTaskDetail() {
  return <TaskDetailPage backTo="/employee/tasks" />
}
