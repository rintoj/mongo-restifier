module.exports = {
  name: 'Task',
  url: '/task',
  schema: {
    id: {
      type: String,
      idField: true
    },
    title: {
      type: String,
      required: true
    },
    description: String
  },

  history: true
};