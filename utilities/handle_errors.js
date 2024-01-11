const handleErrors = (err, req, name, paths = [], errors = {}) => {
    if (err.message.includes(`${name} validation failed`)) {
        Object.values(err.errors).forEach(error => {
            for (let singlePath in paths) {
                if (error.path === paths[singlePath]) {
                    errors[paths[singlePath]] = 'field_required'
                }
            }
            if (!paths.includes(error.path)) {
                errors[error.properties.path] = error.properties.message
            }
        })
    }
    return errors
}

module.exports = { handleErrors }