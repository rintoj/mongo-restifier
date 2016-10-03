module.exports = {
    name: 'Note',
    url: '/note',
    schema: {
        index: {
            type: Number,
            required: true,
            min: 1,
            autoIncrement: true,
            idField: true
        },
        title: {
            type: String,
            required: true
        },
        description: String,
        status: {
            type: String,
            required: true,
            default: 'new',
            enum: ['new', 'progress', 'done', 'hold']
        }
    },

    userSpace: {
        field: "_user"
    },
    timestamps: true
};