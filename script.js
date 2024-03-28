const fieldSizeForm = document.getElementById('custom-size-form')
let rectanglesForm = document.getElementById('rectangles-form')
let perimeterText = document.getElementById('perimeter');
let areaText = document.getElementById('area')

const fieldSize = 50



/*
    vanilla javascript project

    scss naudojamas. ciklai funkcija 

    Perimetro ir ploto skaiciuokle pagal sukurta grida.
    bendras plotas ir kiekvienos figuros atskirai.
    input checkboxes naudojami.
    css grid,
    elementai susijungia kai atsitoja vienas kito. spalvos susijungia.
    figuru mirroring
    local storage naudojamas 
*/


// ant grupiu uzdet PLOTA IR PERIMETRA per viduri
// atcheckinus kad nepasikeistu spalva ilgiausio elemento


// 


function getDataFromLocalStorage(rectanglesForm) {
    const parameters = JSON.parse(localStorage.getItem('parameters'))
    const rowsData = JSON.parse(localStorage.getItem('rows'))

    if (rowsData && parameters) {
        const columnsElements = fieldSizeForm.querySelectorAll(`input[name=columns]`)
        const rowsElements = fieldSizeForm.querySelectorAll(`input[name=rows]`)

        columnsElements.forEach(column => {column.value = parameters.columns})

        rowsElements.forEach(row => {row.value = parameters.rows})


        for (let i = 0; i < rowsData.length; i++) {
            const row = rowsData[i];

            for (let j = 0; j < row.length; j++) {
                const field = row[j];
                const input = document.createElement('input')
                
                const rowNum = i + 2
                const columnNum = j + 2
                input.setAttribute('type', 'checkbox')
                input.dataset.row = rowNum
                input.dataset.column = columnNum
                input.style.gridColumn = columnNum
                input.style.gridRow = rowNum

                if (field > 0) {
                    input.checked = true
                    input.dataset.group = field
                }
                rectanglesForm.append(input)
            }
        }


        rectanglesForm.style.gridTemplateColumns = `20px repeat(${rowsData[0].length}, ${fieldSize}px) 20px`
        rectanglesForm.style.gridTemplateRows = `repeat(${rowsData.length + 2}, ${fieldSize}px)`

        setInitialData()
    }
   
}
getDataFromLocalStorage(rectanglesForm)


fieldSizeForm.addEventListener('input', (e) => {
    if (e.target.type === 'range') {
        const numberElement = e.target.parentElement.parentElement.querySelector('input[type=number]')

        numberElement.value = e.target.value
    } else {
        const rangeElement = e.target.parentElement.parentElement.querySelector('input[type=range]')

        rangeElement.value = e.target.value
    }
})


fieldSizeForm.addEventListener('submit', (e) => {
    e.preventDefault()
    rectanglesForm.innerHTML =''

    let columns = Number(e.target['columns-field'].value)
    let rows = Number(e.target['rows-field'].value)

    localStorage.setItem('parameters', JSON.stringify({columns, rows}))
    let fieldsAmount = columns * rows


    for (let i = 0; i < fieldsAmount; i++) {
        const columnNum = (i % columns) + 2
        const rowNum = Math.floor((i / columns) + 2)
        const input = document.createElement('input')
        input.setAttribute('type', 'checkbox')
        input.dataset.row = rowNum
        input.dataset.column = columnNum
        rectanglesForm.append(input)
        input.style.gridColumn = columnNum
        input.style.gridRow = rowNum
    }

    rectanglesForm.style.gridTemplateColumns = `20px repeat(${columns}, ${fieldSize}px) 20px`
    rectanglesForm.style.gridTemplateRows = `repeat(${rows + 2}, ${fieldSize}px)`


    setRows()
    setGroupsData()
    getGroupsParameters()

    perimeterText.textContent  = 0
    areaText.textContent  = 0
})


rectanglesForm.addEventListener('input', (e) => {
    const field = e.target
    changeGroup(field)

    setInitialData()
})


function setInitialData() {
    setMeasurments()
    setInputsGroups()
    setGroupsData()

    getParameters()
    getGroupsParameters()
}


function setRows() {
    const columnsAmount = Number(fieldSizeForm.querySelector('#columns-field').value)
    const inputs = [...rectanglesForm.querySelectorAll('input[type=checkbox]')]

    const fields = []
    const rows = []

    for (let i = 0; i < inputs.length; i++) {
        const field = 0
        fields.push(field)
    }

    for (let i = 0; i < inputs.length; i+=columnsAmount) {
        const row = fields.slice(i, i + columnsAmount)
        rows.push(row)
    }

    localStorage.setItem('rows', JSON.stringify(rows))
}

function setInputsGroups() {
    const rows = JSON.parse(localStorage.getItem('rows'))
    const inputs = [...rectanglesForm.querySelectorAll('input[type=checkbox]')]

    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];

        const fieldRowIndex = Number(input.dataset.row) - 2
        const fieldColIndex = Number(input.dataset.column) - 2        
        const groupId = rows[fieldRowIndex][fieldColIndex]

        if (groupId !== 0) {
            input.dataset.group = groupId
        } else {
            delete input.dataset.group
        }
    }

    setInputsBorders()
}

function setGroupsData() {
    const inputsEl = [...document.querySelectorAll('[data-group]')]
    const groupsEl = Object.values(Object.groupBy(inputsEl, inputEl => inputEl.dataset.group))
    const groupsData = []
    
    for (let i = 0; i < groupsEl.length; i++) {
        const groupEl = groupsEl[i];
        const { backgroundColor: classStyle } = getComputedStyle(groupEl[0]);

        const groupData = {
            group: groupEl[0].dataset.group,
            fields: [],
            color: classStyle
        }
        
        for (let j = 0; j < groupEl.length; j++) {
            const input = groupEl[j];

            const field = {row: Number(input.dataset.row), col: Number(input.dataset.column)}
            groupData.fields.push(field)
        }
        groupsData.push(groupData)
    }

    localStorage.setItem('groups-data', JSON.stringify(groupsData))
}



function find(group, checkedFields, rows, fieldRowIndex, fieldColIndex) {
    const fieldNeighbors = getNeighborFields(rows, fieldRowIndex, fieldColIndex).checked

    checkedFields.push({row: fieldRowIndex, col: fieldColIndex})
    group.push({row: fieldRowIndex, col: fieldColIndex})

    fieldNeighbors.forEach(neighbor => {
        if (!checkedFields.some(field => field.row === neighbor.row && field.col === neighbor.col)) {
            find(group, checkedFields, rows, neighbor.row, neighbor.col)
        }
    })
}

function getNeighborFields(rows, fieldRowIndex, fieldColIndex) {
    const topField = rows[fieldRowIndex - 1] && rows[fieldRowIndex - 1][fieldColIndex]
    const bottomField = rows[fieldRowIndex + 1] && rows[fieldRowIndex + 1][fieldColIndex]
    const leftField = rows[fieldRowIndex] && rows[fieldRowIndex][fieldColIndex - 1]
    const rightField = rows[fieldRowIndex] && rows[fieldRowIndex][fieldColIndex + 1]

    const checked = []

    if (topField > 0) {
        checked.push({row: fieldRowIndex - 1, col: fieldColIndex})
    }

    if (bottomField > 0) {
        checked.push({row: fieldRowIndex + 1, col: fieldColIndex})
    }

    if (leftField > 0) {
        checked.push({row: fieldRowIndex, col: fieldColIndex - 1})
    }
    if (rightField > 0) {
        checked.push({row: fieldRowIndex, col: fieldColIndex + 1})
    }


    return {
        fields: {topField, bottomField, leftField, rightField},
        checked
    }
}


function changeGroup(input) {
    let rows = JSON.parse(localStorage.getItem('rows'))
    const allGroupIds = [... new Set(rows.flat().filter(groupId => groupId > 0))]

    const fieldRowIndex = Number(input.dataset.row) - 2
    const fieldColIndex = Number(input.dataset.column) - 2


    if (input.checked) {
        let newGroup

        if (allGroupIds.length === 0) {
            newGroup = 1
        } else {
            const possibleGroups = []
    
            const neighbors = getNeighborFields(rows, fieldRowIndex, fieldColIndex).fields

            if (neighbors?.topField > 0) {
                possibleGroups.push(neighbors.topField)
            }
            if (neighbors?.bottomField > 0) {
                possibleGroups.push(neighbors.bottomField)
            }
            if (neighbors?.leftField > 0) {
                possibleGroups.push(neighbors.leftField)
            }
            if (neighbors?.rightField > 0) {
                possibleGroups.push(neighbors.rightField)
            }
     
            if (possibleGroups.length > 0) {
                const groupsIds = rows.flat(1).filter(group => possibleGroups.some(id => id === group))

                const groupsArrays = Object.values(Object.groupBy(groupsIds, value => value))
                const groupId =  groupsArrays.reduce((acc, value) => acc.length > value.length ? acc : value)[0]

                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i];

                    for (let j = 0; j < row.length; j++) {
                        if (groupsIds.includes(row[j])) {
                            row.splice(j, 1, groupId)
                        }
                    }
                }

                newGroup = groupId
            } else {
                const skippedGroupsIds = getSkippedGroupsIds(allGroupIds)

                if (skippedGroupsIds > 0) {
                    newGroup = Math.min(...skippedGroupsIds)
                } else {
                    newGroup = Math.max(...allGroupIds) + 1
                } 
            }
        }
        rows[fieldRowIndex].splice(fieldColIndex, 1, newGroup)

    } else {
        rows[fieldRowIndex].splice(fieldColIndex, 1, 0)

        const groups = []
        const checkedFields = []

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            if (i === fieldRowIndex || i === fieldRowIndex - 1 || i === fieldRowIndex + 1) {
                for (let j = 0; j < row.length; j++) {
                    const field = row[j];
                    
                    if (j === fieldColIndex || j === fieldColIndex - 1 || j === fieldColIndex + 1) {

                        if (!checkedFields.some(field => field.row === i && field.col === j) && field > 0) {
                            const group = []
                            find(group, checkedFields, rows, i, j)
                            groups.push(group)
                        }
                    }
                }
            }
        }
        
        const longestGroup = groups.reduce((result, group) => {
            return result.length > group.length ? result : group
        }, [])

        groups.forEach(group => {
            const skippedGroupsIds = getSkippedGroupsIds(allGroupIds)
            let groupId
    
            if (skippedGroupsIds.length > 0) {
                groupId = Math.min(...skippedGroupsIds)
            } else {
                groupId = Math.max(...allGroupIds) + 1
            }

            console.log(longestGroup, group);
            if (longestGroup !== group) {
                group.forEach(field => {
                    rows[field.row].splice(field.col, 1, groupId)
                })

            }
            allGroupIds.push(groupId)
        })
    }

    localStorage.setItem('rows', JSON.stringify(rows))
}

function getSkippedGroupsIds(allGroupIds) {
    const skippedGroupsIds = []
    for(let i = 1; i <= allGroupIds.length; i++) { 
        if (allGroupIds.indexOf(i) === -1) {
            skippedGroupsIds.push(i)
        }
    } 

    return skippedGroupsIds
}

function setInputsBorders() {
    const rows = JSON.parse(localStorage.getItem('rows'))

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        for (let j = 0; j < row.length; j++) {
            const field = row[j];
            
            const {topField, bottomField, leftField, rightField} = getNeighborFields(rows, i, j).fields
            
            if (field > 0) {
                const currentInput = document.querySelector(`[data-row="${i+2}"][data-column="${j+2}"]`)
                currentInput.className = ''
                
                if (topField > 0) {
                    currentInput.classList.add('top')
                }
                if (bottomField > 0) {
                    currentInput.classList.add('bottom')
                }
                if (leftField > 0) {
                    currentInput.classList.add('left')
                }
                if (rightField > 0) {
                    currentInput.classList.add('right')
                }
            }
        }
    }
}

function setMeasurments() {
    const oldMeasurments = document.querySelectorAll('.measurment');

    oldMeasurments.forEach(oldMeasurment => {
        oldMeasurment.remove();
    });

    const rows = JSON.parse(localStorage.getItem('rows'));
    const columns = rows[0].map((_, index) => rows.map(row => row[index]));

    createMeasurmentText(rows, 'row')
    createMeasurmentText(columns, 'column')
}

function createMeasurmentText(rows, className) {
    const createdParameters = []

    let group = null
    let startColIndex = null
    let rowIndex = null
    let colSpan = 0

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        for (let j = 0; j < row.length; j++) {
            const field = row[j];
            const topField = rows[i - 1] ? rows[i - 1][j] : 0

            if (field > 0) {
                if ((topField === 0)) {
                    if (!startColIndex && !rowIndex && !group) {
                        group = field
                        startColIndex = j
                        rowIndex = i
                    }
                    colSpan++
                } else {
                    if (colSpan > 0) {
                        if (!createdParameters.some(item => item[0] === group && item[1] === colSpan && item[2] === startColIndex)) {
                            createSpanElement(colSpan, rowIndex, startColIndex, '', className);
                            createdParameters.push([group, colSpan, startColIndex])
                        }

                        group = null
                        startColIndex = null
                        rowIndex = null
                        colSpan = 0
                    }
                }

            } 
            if (colSpan > 0 && (field === 0 || j === row.length -1)) {
                if (!createdParameters.some(item => item[0] === group && item[1] === colSpan && item[2] === startColIndex)) {
                    createSpanElement(colSpan, rowIndex, startColIndex, '', className);
                    createdParameters.push([group, colSpan, startColIndex])
                }
                
                group = null
                startColIndex = null
                rowIndex = null
                colSpan = 0
            }
        }
    }

    let group2 = null
    let startColIndex2 = null
    let rowIndex2 = null
    let colSpan2 = 0

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        for (let j = 0; j < row.length; j++) {
            const field = row[j];
            const bottomField = rows[i + 1] ? rows[i + 1][j] : 0
            
            if (field > 0) {
                if (bottomField === 0) {
                    if (!startColIndex2 && !rowIndex2 && !group2) {
                        group2 = field
                        startColIndex2 = j
                        rowIndex2 = i
                    }
    
                    colSpan2++
                } else if (colSpan2 > 0) {
                    if (!createdParameters.some(item => item[0] === group2 && item[1] === colSpan2 && item[2] === startColIndex2)) {
                        createSpanElement(colSpan2, rowIndex2, startColIndex2, 'bottom', className)
                        createdParameters.push([group2, colSpan2, startColIndex2])
                    }

                    group2 = null
                    startColIndex2 = null
                    rowIndex2 = null
                    colSpan2 = 0
                }
            }
            if (colSpan2 > 0 && (field === 0 || j === row.length -1)) {
                if (!createdParameters.some(item => item[0] === group2 && item[1] === colSpan2 && item[2] === startColIndex2)) {
                    createSpanElement(colSpan2, rowIndex2, startColIndex2, 'bottom', className);
                    createdParameters.push([group2, colSpan2, startColIndex2])
                }

                group2 = null
                startColIndex2 = null
                rowIndex2 = null
                colSpan2 = 0
            }
        }

    }

    function createSpanElement(spanWidth, rowIndex, startColumnIndex, position, className) {
        const gridRow = rowIndex + 2
        const gridColumn = startColumnIndex + 2

        const text = document.createElement('span')
        text.className = 'measurment'
        text.textContent = spanWidth * 100
        text.classList.add(className)
        
        if (className === 'column') {
            text.style.gridRowStart = gridColumn
            text.style.gridRowEnd = gridColumn + spanWidth;

            if (position === 'bottom') {
                text.classList.add('bottom')
                text.style.gridColumn = gridRow + 1
                
            } else {
                text.style.gridColumn = gridRow - 1
                text.classList.add('top')

            }
        } else {
            text.style.gridColStart = gridColumn
            text.style.gridColumnEnd = gridColumn + spanWidth;

            if (position === 'bottom') {
                text.classList.add('bottom')
                text.style.gridRow = gridRow + 1

            } else {
                text.classList.add('top')
                text.style.gridRow = gridRow - 1

            }
        }

        rectanglesForm.append(text);
    }
} 


function getParameters() {
    const rows = JSON.parse(localStorage.getItem('rows'))

    let width = 100
    let height = 100
    let fieldArea = width*height 
    let area = 0

    let perimeter = 0

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        for (let j = 0; j < row.length; j++) {
            const currentField = row[j]
            const {topField, bottomField, leftField, rightField} = getNeighborFields(rows, i, j).fields

            if (currentField > 0) {
                let fieldPerimeter = 400
                area += fieldArea
                
                if (topField > 0) {
                    fieldPerimeter -= 100
                }
          
                if (bottomField > 0) {
                    fieldPerimeter -= 100
                }
                
                if (leftField > 0) {
                    fieldPerimeter -= 100
                }
                if (rightField > 0) {
                    fieldPerimeter -= 100
                }

                perimeter += fieldPerimeter
            }

            areaText.textContent = area
            perimeterText.textContent = perimeter
        }
    }
}

function getGroupsParameters() {
    const oldData = document.querySelectorAll('.group-parameters')
    oldData.forEach(old => {
        old.remove()
    })

    const groupsData = JSON.parse(localStorage.getItem('groups-data'))

    const rows = JSON.parse(localStorage.getItem('rows'))
    const groupsParameters = document.getElementById('groups-parameters')

    for (let i = 0; i < groupsData.length; i++) {
        const group = groupsData[i];
        let groupPerimeter = 0
        let groupArea = 0

        for (let j = 0; j < group.fields.length; j++) {
            const currentField = group.fields[j];
            const fieldRow = currentField.row
            const fieldCol = currentField.col

            const {topField, bottomField, leftField, rightField} = getNeighborFields(rows, fieldRow - 2, fieldCol - 2).fields
            let fieldPerimeter = 400
                
            if (topField > 0) {
                fieldPerimeter -= 100
            }
      
            if (bottomField > 0) {
                fieldPerimeter -= 100
            }
            
            if (leftField > 0) {
                fieldPerimeter -= 100
            }
            if (rightField > 0) {
                fieldPerimeter -= 100
            }

            groupArea+=10000
            groupPerimeter += fieldPerimeter
        }


        
        const groupParameters = document.createElement('div')
        groupParameters.className = 'group-parameters'
    
        const parametersText = document.createElement('div')
        parametersText.classList.add('parameters-text')

        const perimeterEl = document.createElement('p')
        perimeterEl.textContent = 'Perimeter: '
        const perimeterText = document.createElement('span')
        perimeterText.textContent = groupPerimeter
        perimeterEl.append(perimeterText)
    
        const areaEl = document.createElement('p')
        areaEl.textContent = 'Area: '
        const areaText = document.createElement('span')
        areaText.textContent = groupArea
        areaEl.append(areaText)
    
        const groupGrid = document.createElement('div')
        groupGrid.className = 'group-grid'
        

        const maxRow = group.fields.reduce((max, field) => field.row > max.row ? field : max).row
        const maxCol = group.fields.reduce((max, field) => field.col > max.col ? field : max).col

        const minRow = group.fields.reduce((min, field) => field.row < min.row ? field : min).row
        const minCol = group.fields.reduce((min, field) => field.col < min.col ? field : min).col



        const wrapper = document.createElement('div')
        wrapper.classList.add('measurment')
        const area = document.createElement('p')
        area.textContent = `S: ${groupArea}`
        const perimeter = document.createElement('p')
        perimeter.textContent = `P: ${groupPerimeter}`

        wrapper.append(area, perimeter)
        rectanglesForm.append(wrapper)

     
        const rowMiddle = Math.floor((maxRow+minRow)/2)
        const colMiddle = Math.floor((maxCol+minCol)/2)

    
        
        function getPositions(rowStart, colStart) {
            return [
                {row: rowStart, col: colStart},
                {row: rowStart - 1, col: colStart},
                {row: rowStart + 1, col: colStart},
                {row: rowStart, col: colStart - 1},
                {row: rowStart, col: colStart + 1},
            ]
        }
   
        const positions = getPositions(rowMiddle, colMiddle)

        let rowStart
        let rowEnd
        let colStart
        let colEnd

        for (let i = 0; i < positions.length; i++) {
            const position = positions[i]
            const { row, col } = position
            const middleField = group.fields.find(field => field.row === row && field.col === col)
        
            if (middleField) {
                console.log("Middle field:", middleField);
                const rowIndex = middleField.row
                const colIndex = middleField.col


                const topExists = group.fields.some(field => field.row === rowIndex - 1 && field.col === colIndex)

                const bottomExists = group.fields.some(field => field.row === rowIndex + 1 && field.col === colIndex)

                const leftExists = group.fields.some(field => field.row === rowIndex && field.col === colIndex - 1)
                const rightExists = group.fields.some(field => field.row === rowIndex && field.col === colIndex + 1)

                rowStart = rowIndex
                rowEnd = rowIndex + 1
                colStart = colIndex
                colEnd = colIndex + 1

                if (bottomExists) {
                    const sameColItems = group.fields.filter(field => field.col === colIndex)

                    if (sameColItems.length % 2 === 0) {
                        rowEnd = rowIndex + 2
                    }

                    if (rightExists && !leftExists) {
                        const bottomRight = group.fields.some(field => field.row === rowIndex + 1 && field.col === colIndex + 1)
                        
                        if (bottomRight) {
                            colEnd = colIndex + 2
                        }
                    } else if (leftExists && !rightExists) {
                        const bottomRight = group.fields.some(field => field.row === rowIndex + 1 && field.col === colIndex - 1)
                        
                        if (bottomRight) {
                            colStart = colIndex - 1
                        }
                    }    
                } else if (topExists) {
                    rowStart = rowIndex - 1

                    if (rightExists && !leftExists) {
                        const topRight = group.fields.some(field => field.row === rowIndex - 1 && field.col === colIndex + 1)
    
                        if (topRight) {
                            colEnd = colIndex + 2
                        }
                    } else if (leftExists && !rightExists) {
                        const topLeft = group.fields.some(field => field.row === rowIndex - 1 && field.col === colIndex - 1)

                        if (topLeft) {
                            colStart = colIndex - 1
                        }
                    }
                } else if (rightExists) {
                    const sameRowItems = group.fields.filter(field => field.row === rowIndex)
                    if (sameRowItems.length % 2 === 0) {
                        colEnd = colIndex + 2
                    }
                } else if (leftExists) {
                    colStart = colIndex - 1
                }
                break;
            }
        }
        console.log(`rowS: ${rowStart}, rowE: ${rowEnd}, colS: ${colStart}, colE: ${colEnd}`);
        
        wrapper.style.gridRowStart = rowStart
        wrapper.style.gridRowEnd = rowEnd
        wrapper.style.gridColumnStart = colStart
        wrapper.style.gridColumnEnd = colEnd



        const rowsLength = maxRow - minRow + 1
        const colsLength = maxCol - minCol + 1

        groupGrid.style.gridTemplateRows = `repeat(${rowsLength}, 15px)`
        groupGrid.style.gridTemplateColumns = `repeat(${colsLength}, 15px)`

        for (let i = 0; i < rowsLength; i++) {
            for (let j = 0; j < colsLength; j++) {
                const element = document.createElement('span')
                
                group.fields.forEach(field => {
                    if (field.row - minRow === i && field.col - minCol === j) {
                        element.style.backgroundColor = group.color
                    }
                })
 
                groupGrid.append(element)
            }
        }
    
        parametersText.append(perimeterEl, areaEl)
        groupParameters.append(parametersText, groupGrid)
        groupsParameters.append(groupParameters)
    }
}