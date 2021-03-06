const fs = require('fs');
var path = require('path');
fs.writeFileSync(path.join(__dirname, './log.txt'), '')
let jsonPath = path.join(__dirname, './json/')
let toJsonPath = path.join(__dirname, './toJson2/')
let total = 0
let errorNum = 0
let config = require('./config.json')
let {
  onceLabelFiledList,
  resetFiled
} = config.app2
resetFiled = resetFiled.sort((a, b) => b.key.length - a.key.length)
let errName = ''

if (!fs.existsSync(toJsonPath)) {
  fs.mkdirSync(toJsonPath)
}


function whireJson(val, name, newPath) {
  const filePath = path.join(newPath, name)
  fs.writeFile(filePath, val, err1 => {
    if (err1) {
      throw err1;
    }
    // console.log(`${newPath}${name}成功写入文件`);
  })
}

// 地柜文件夹
function readJson(jsonPath = '', toJsonPath = '') {
  const ressultDir = fs.readdirSync(jsonPath)
  while (ressultDir.length) {
    let el = ressultDir.pop()
    const data = fs.statSync(jsonPath + el)
    if (data.isDirectory()) {
      jsonPath = path.join(jsonPath, el, '/')
      toJsonPath = path.join(toJsonPath, el, '/')
      if (!fs.existsSync(toJsonPath)) {
        fs.mkdirSync(toJsonPath)
      }
      return readJson(jsonPath, toJsonPath)
    } else if (path.extname(el) === '.json') {
      try {
        total += 1
        const json = fs.readFileSync(jsonPath + el, 'utf8')
        const model = JSON.parse(json)
        const bigIndexList = []
        let lastBigIndex = null
        model.shapes.forEach((item, index) => {
          delete item.fill_color
          delete item.line_color
          errName = `${toJsonPath}${el}---文件：${total}---框：${index}--${item.label}`
          // 替换
          resetFiled.forEach(forItem => {
            item.label = String(item.label).replace(new RegExp(forItem.key, "g"), forItem.value.replace(new RegExp('-', "g"), '&^&'))
          })
          // blank不动
          if (item.label.startsWith('blank')) {
            item.type = 'blank'
            delete item.label
            return
          }
          // 一级必填都有说明是一级
          const isOne = onceLabelFiledList.every(el => item.label.includes(el))
          // 一级
          if (isOne) {
            item.type = 'vehicle'
            lastBigIndex = index
            bigIndexList.push(index)
            let valueList = item.label.split('-').map(el => {
              return el.split('_')
            })
            const hasChrend = valueList.find(el => el[0] === '车辆子类型')
            valueList = valueList.map(el => el.pop())
            const result = valueList.slice(0, 1)
            if (!hasChrend) result.push(undefined)
            result.push(...valueList.slice(1))
            if (result[6]) {
              result[5] = [result[5], result[6]].join('-')
            };
            [result[0], result[1]].forEach((el, index) => {
              if (el) {
                result[index] = el.replace('&^&', '-')
              }
            })
            item.vehicle_type = [result[0], result[1]].filter(el => el).join(',')
            item.vehicle_attribute = [result[2], result[3]].join(',')
            item.other_fact = [result[4], result[5]].join(',')
            delete item.label
          } else {
            const activeCar = resetFiled.find(el => el.key === '车牌内容')
            const resetCar = `${activeCar?activeCar.value:'车牌内容'}_`
            const activeOcc = resetFiled.find(el => el.key === '遮挡')
            const resetOcc = `${activeOcc?activeOcc.value:'遮挡'}_`
            let text = 'none'
            let license_plate_color = ''
            // 车牌
            let repiceFeild = null
            if (item.label.includes('-车牌颜色_')) repiceFeild = '-车牌颜色_'
            if (item.label.includes('-颜色属性_')) repiceFeild = '-颜色属性_'
            if (repiceFeild) {
              const valueList = item.label.split(repiceFeild)
              license_plate_color = valueList[1]
            }
            // 小框
            if (item.label.includes(resetCar)) {
              text = item.label.split(resetCar).pop()
              if (repiceFeild) {
                text = text.split(repiceFeild)[0]
              }
            }
            const sub_bboxes = {
              ...item,
              sub_type: 'License',
              text,
              license_plate_color,
              occlude: item.label.includes(resetOcc) ? `yes,${item.label.split(resetOcc).pop().split('-')[0]}` : 'not'
            }
            item.needDel = true
            delete sub_bboxes.label
            // 判断是不是顺序来的
            const {
              points
            } = model.shapes[lastBigIndex]
            // 是否完全在里边
            const isIn = item.points.every(el => {
              // x                  y
              return el[0] <= points[1][0] && el[0] >= points[0][0] && el[1] <= points[1][1] && el[1] >= points[0][1]
            })
            if (isIn && !model.shapes[lastBigIndex].sub_bboxes) {
              model.shapes[lastBigIndex].sub_bboxes = sub_bboxes
            } else {
              const fartherList = bigIndexList.filter(findEl => {
                const {
                  points
                } = model.shapes[findEl]
                return item.points.every(el => {
                  // x                  y
                  return el[0] <= points[1][0] && el[0] >= points[0][0] && el[1] <= points[1][1] && el[1] >= points[0][1]
                }) && !model.shapes[findEl].sub_bboxes
              })
              model.shapes[fartherList.pop()].sub_bboxes = sub_bboxes
            }
          }
        })
        model.shapes = model.shapes.filter(el => !el.needDel)
        whireJson(JSON.stringify(model, '', '\t'), el, toJsonPath)
      } catch (error) {
        errorNum+=1
        console.log(error)
        console.log(`${errName}有问题`)
        fs.appendFileSync(path.join(__dirname, './log.txt'), `${errName}有问题\n`, 'utf8')
      }
    }
  }
}

readJson(jsonPath, toJsonPath)
console.log(`本次处理${total}个，有问题${errorNum}个，记录在${path.join(__dirname, './log.txt')}`)