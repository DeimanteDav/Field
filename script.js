const fieldSizeForm = document.getElementById('custom-size-form')
let rectanglesForm = document.getElementById('rectangles-form')
let resetBtn = document.getElementById('reset-btn')
let perimeterText = document.getElementById('perimeter');
let areaText = document.getElementById('area')

function getDataFromLocalStorage(rectanglesForm, perimeterText, areaText) {
    const parameters = JSON.parse(localStorage.getItem('parameters'))
    const rectanglesFormData = JSON.parse(localStorage.getItem('rectangles-form'))
    const rectanglesFormStyle = JSON.parse(localStorage.getItem('rectangles-form-style'))
    const perimeter = JSON.parse(localStorage.getItem('perimeter'))
    const area = JSON.parse(localStorage.getItem('area'))


    if (rectanglesFormData && rectanglesFormStyle) {
        rectanglesForm.innerHTML = rectanglesFormData
        let checkedInputs = rectanglesForm.querySelectorAll('[data-group]')
        console.log(checkedInputs);
        checkedInputs.forEach(input => {
            input.checked = true
        })

        const formStyle = JSON.parse(localStorage.getItem('rectangles-form-style'))
    
        rectanglesForm.style.gridTemplateColumns = formStyle.columns
        rectanglesForm.style.gridTemplateRows = formStyle.rows
        rectanglesForm.style.width = formStyle.width

        if (perimeter) {
            perimeterText.textContent = perimeter
        }
        
        if (area) {
            areaText.textContent = area
        }
    
        if (parameters) {
    
        }
    }
   
}
getDataFromLocalStorage(rectanglesForm, perimeterText, areaText)



fieldSizeForm.addEventListener('input', (e) => {
    if (e.target.type === 'range') {
        let numberElement = e.target.parentElement.parentElement.querySelector('input[type=number]')

        numberElement.value = e.target.value
    } else {
        let rangeElement = e.target.parentElement.parentElement.querySelector('input[type=range]')

        rangeElement.value = e.target.value
    }
})

fieldSizeForm.addEventListener('submit', (e) => {
    e.preventDefault()
    rectanglesForm.innerHTML =''

    let columns = e.target['columns-field'].value
    let rows = e.target['rows-field'].value
    localStorage.setItem('parameters', JSON.stringify({columns, rows}))
    let fieldsAmount = columns * rows

    for (let i = 0; i < fieldsAmount; i++) {
        const columnNum = (i % columns) + 1
        const rowNum = Math.floor((i / columns) + 1) 
        const field = document.createElement('input')
        field.setAttribute('type', 'checkbox')
        field.dataset.row = rowNum
        field.dataset.column = columnNum
        rectanglesForm.append(field)
    }

    rectanglesForm.style.gridTemplateColumns = `repeat(${columns}, 1fr)`
    rectanglesForm.style.gridTemplateRows = `repeat(${rows}, 1fr)`
    rectanglesForm.style.width = `${columns*50}px`


    localStorage.setItem('rectangles-form-style', JSON.stringify({columns: rectanglesForm.style.gridTemplateColumns, rows: rectanglesForm.style.gridTemplateRows, width: rectanglesForm.style.width}))
    localStorage.setItem('rectangles-form', JSON.stringify(rectanglesForm.innerHTML))
    perimeterText.textContent  = 0
    areaText.textContent  = 0
})


rectanglesForm.addEventListener('input', (e) => {
    let columnsAmount = Number(fieldSizeForm.querySelector('#columns-field').value)
    let fields = [...rectanglesForm.children]
    let rowsEl = []

    console.log(JSON.parse(localStorage.getItem('rectangles-form')));

    for (let i = 0; i < fields.length; i+=columnsAmount) {
        // perdaryt kaip rowsEl tik koordinates
        let row = fields.slice(i, i + columnsAmount)
        rowsEl.push(row)
    }

    let field = e.target

    const inputsEl = [...document.querySelectorAll('[data-group]')]
    const groupsEl = Object.values(Object.groupBy(inputsEl, inputEl => inputEl.dataset.group))

    const groupsData = []

    for (let i = 0; i < groupsEl.length; i++) {
        const groupEl = groupsEl[i];

        const groupData = {
            group: groupEl[0].dataset.group,
            fields: []
        }

        for (let j = 0; j < groupEl.length; j++) {
            const input = groupEl[j];

            const field = {x: input.dataset.column, y: input.dataset.row}
            groupData.fields.push(field)
        }
        groupsData.push(groupData)
    }

    changeGroup(field, groupsData)
    localStorage.setItem('groups', JSON.stringify(groupsData))
    

    getPerimeter(rowsEl)
    getArea(fields)

    localStorage.setItem('rectangles-form', JSON.stringify(rectanglesForm.innerHTML))
})


resetBtn.addEventListener('click', (e) => {
    let fields = [...rectanglesForm.children]
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        field.checked = false
        field.style.border = 'none'
        delete field.dataset.group
    }
})


function getNeighbors(field) {
    const currentColumn = Number(field.dataset.column)
    const currentRow = Number(field.dataset.row)

    const topEl = document.querySelector(`[data-row="${currentRow-1}"][data-column="${currentColumn}"]`)
    const bottomEl = document.querySelector(`[data-row="${currentRow+1}"][data-column="${currentColumn}"]`)
    const leftEl = document.querySelector(`[data-row="${currentRow}"][data-column="${currentColumn-1}"]`)
    const rightEl = document.querySelector(`[data-row="${currentRow}"][data-column="${currentColumn+1}"]`)

    return {topEl, bottomEl, leftEl, rightEl}
}

function getCheckedNeighbors(field) {
    const {topEl, bottomEl, leftEl, rightEl} = getNeighbors(field)
    const neighbors = []
   
    if (topEl?.checked) {
        neighbors.push(topEl)
    }
    if (bottomEl?.checked) {
        neighbors.push(bottomEl)
    }
    if (leftEl?.checked) {
        neighbors.push(leftEl)
    }
    if (rightEl?.checked) {
        neighbors.push(rightEl)
    }
    
    return neighbors
}

function areFieldsConnected(field1, field2) {
    return (
        (Math.abs(field1.x - field2.x) === 1 && field1.y === field2.y) ||
        (Math.abs(field1.y - field2.y) === 1 && field1.x === field2.x)
    );
}

function findCommonFields(field, group, checkedFields) {
    const fieldNeighbors = getCheckedNeighbors(field)
    checkedFields.push(field)
    group.push(field)

    fieldNeighbors.forEach(neighbor => {
        if (!checkedFields.includes(neighbor)) {
            findCommonFields(neighbor, group, checkedFields)
        }
    })
}


function changeGroup(field, groupsData) {
    if (field.checked) {
        if (groupsData.length === 0) {
            field.dataset.group = 1
        } else {
            setFieldGroup(field, groupsData)
        }
    } else {
        const currentGroupData = groupsData.filter(groupData => groupData.group === field.dataset.group)[0]

        const currentFields = currentGroupData.fields.filter(otherField => {
            return otherField.x !== field.dataset.column || otherField.y !== field.dataset.row
        })

        currentGroupData.fields = currentFields
        delete field.dataset.group

        const groupElements = [...document.querySelectorAll(`[data-group="${currentGroupData.group}"]`)]
        const groupIndex = groupsData.indexOf(currentGroupData)
        groupsData[groupIndex].fields = currentFields

        const allGroupIds = groupsData.map(groupData => groupData.group)

        const groups = []
        const checkedFields = []
        groupElements.forEach(input => {
            if (!checkedFields.includes(input)) {
                const group = []
                findCommonFields(input, group, checkedFields)
                groups.push(group)
            }
        })
        
        if (groups.length > 1) {
            groups.forEach(group => {
                const skippedGroupsIds = getSkippedGroupsIds(allGroupIds)
                let groupId
                console.log(skippedGroupsIds);
    
                if (skippedGroupsIds.length > 0) {
                    groupId = Math.min(...skippedGroupsIds)
                } else {
                    groupId = Math.max(...allGroupIds) + 1
                }
                group.forEach(field => {
                    field.dataset.group = groupId
                    console.log(field.dataset.group);
                    
                    allGroupIds.push(field.dataset.group)
                })
            })
        }
        console.log(groups);

    }
}


function setFieldGroup(field, groupsData) {
    const currentCoordinates = {x: field.dataset.column, y: field.dataset.row}

    const possibleGroupsId = []

    for (let i = 0; i < groupsData.length; i++) {
        const groupData = groupsData[i];

        for (let j = 0; j < groupData.fields.length; j++) {
            const otherField =  groupData.fields[j];
            const groupId = groupData.group

            const areConnected = areFieldsConnected(currentCoordinates, otherField)
            
            if (areConnected) {
                possibleGroupsId.push(groupId)
            } else {
                const allGroupIds = groupsData.map(groupData => groupData.group)
                const skippedGroupsIds = getSkippedGroupsIds(allGroupIds)
                
                if (skippedGroupsIds.length > 0) {
                    field.dataset.group = Math.min(...skippedGroupsIds)
                } else {
                    field.dataset.group = Math.max(...allGroupIds) + 1
                }
            }
        }   
    }

    if (possibleGroupsId.length > 0) {
        const possibleGroups = []
        for (let i = 0; i < possibleGroupsId.length; i++) {
            const possibleGroupId = possibleGroupsId[i];
            possibleGroups.push(groupsData.filter(groupData => groupData.group === possibleGroupId)[0])
        }

        for (let i = 0; i < possibleGroups.length; i++) {
            const possibleGroupsIdsEqual = possibleGroups.every(group => group.fields.length === possibleGroups[0].fields.length)

            const possibleGroupElements = (document.querySelectorAll(`[data-group="${possibleGroupsId[i]}"]`))
            
            const biggestGroupId = possibleGroupsIdsEqual ? possibleGroups[0].group : possibleGroups.reduce((acc, value) => acc.fields.length > value.fields.length ? acc : value).group

            possibleGroupElements.forEach(input => input.dataset.group = biggestGroupId)
            field.dataset.group = biggestGroupId
        }
    }
}

function getSkippedGroupsIds(allGroupIds) {
    console.log(allGroupIds);
    const skippedGroupsIds = []
    for(let i = 1; i <= allGroupIds.length; i++) { 
        if (allGroupIds.indexOf(`${i}`) === -1) {
            skippedGroupsIds.push(`${i}`)
        }
    } 

    return skippedGroupsIds
}




// function setMeasurments() {
//     const inputsInGroups = document.querySelectorAll('[data-group]')
//     let allGroupsNums = []
//     let groups = []
//     let nums = []

//     for (let i = 0; i < inputsInGroups.length; i++) {
//         const input = inputsInGroups[i];
//         nums.push(input.dataset.group)

//         allGroupsNums = ([...new Set(nums)]).sort()
//     }

//     let grid = []
//     for (let i = 0; i < allGroupsNums.length; i++) {
//         const groupNum = allGroupsNums[i];
        
//         const group = [...document.querySelectorAll(`[data-group="${groupNum}"]`)]
//         grid.push({rows: [], columns: []})
          
//         for (let j = 0; j < group.length; j++) {
//             const input = group[j];
//             grid[i].rows.push(Number(input.dataset.row))
//             grid[i].columns.push(Number(input.dataset.column))
//         }
//     }
// }



function getPerimeter(rows) {
    let perimeter = 0

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let topFields = []
        let bottomFields = []

        if (i > 0) {
            topFields = rows[i-1]
        }
        if (i < rows.length - 1) {
            bottomFields = rows[i+1]
        }
        
        for (let j = 0; j < row.length; j++) {
            const currentField = row[j]
            const leftField = row[j - 1] 
            const rightField = row[j + 1]

            if (currentField.checked) {
                let fieldPerimeter = 400
                // su klasem ir classList.remove()
                currentField.className = ''
                
                if (topFields[j] && topFields[j].checked) {
                    fieldPerimeter -= 100
                    currentField.classList.add('top')
                }
                if (bottomFields[j] && bottomFields[j].checked) {
                    fieldPerimeter -= 100
                    currentField.classList.add('bottom')
                }
                
                if (leftField && leftField.checked) {
                    fieldPerimeter -= 100
                    currentField.classList.add('left')
                }
                if (rightField && rightField.checked) {
                    fieldPerimeter -= 100
                    currentField.classList.add('right')
                }

                perimeter += fieldPerimeter
            }

            perimeterText.textContent = perimeter
            localStorage.setItem('perimeter', perimeter)
        }
    }
}

function getArea(fields) {
    let width = 100
    let height = 100
    let area = 0
    
    for (let i = 0; i < fields.length; i++) {
        let field = fields[i]
        if (field.checked) {
            let fieldArea = width*height 
            area += fieldArea
        }
    }
    areaText.textContent = area
    localStorage.setItem('area', area)
}