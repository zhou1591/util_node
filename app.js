const fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var parseString = require('xml2js').parseString;
var builder = new xml2js.Builder() //用于把json对象解析为xml

let xmlPath = path.join(__dirname, './xml/')
let toXmlPath = path.join(__dirname, './toxml/')

let jsonPath = path.join(__dirname, './json/')
let toJsonPath = path.join(__dirname, './toJson/')

let config = require('./config.json')
const {
  delName,
  addXmlField,
  addXmlDefaultField
} = config.app

if (!fs.existsSync(toXmlPath)) {
  fs.mkdirSync(toXmlPath)
}

if (!fs.existsSync(toJsonPath)) {
  fs.mkdirSync(toJsonPath)
}

function whireXML(val, name, newPath) {
  var outxml = builder.buildObject(val);
  const filePath = path.join(newPath, name)

  fs.writeFile(filePath, outxml.toString(), err1 => {
    if (err1) {
      throw err1;
    }
    console.log(`${newPath}${name}成功写入文件`);
  })
}

function whireJson(val, name, newPath) {
  const filePath = path.join(newPath, name)
  fs.writeFile(filePath, val, err1 => {
    if (err1) {
      throw err1;
    }
    console.log(`${newPath}${name}成功写入文件`);
  })
}


// 地柜文件夹
function readXml(newPath = '', toXmlPath = '') {
  const ressultDir = fs.readdirSync(newPath)
  while (ressultDir.length) {
    let el = ressultDir.pop()
    const data = fs.statSync(newPath + el)
    if (data.isDirectory()) {
      newPath = path.join(newPath, el, '/')
      toXmlPath = path.join(toXmlPath, el, '/')
      if (!fs.existsSync(toXmlPath)) {
        fs.mkdirSync(toXmlPath)
      }
      readXml(newPath, toXmlPath)
    } else if (path.extname(el) === '.xml') {
      parseString(fs.readFileSync(newPath + el, 'utf8'), (err, result) => {
        result.annotation.object.forEach(el => {
          delName.forEach(item => {
            el.name = [String(el.name[0]).replace(new RegExp(item, "g"), "")]
          })
          // 给xml 添加默认值
          addXmlDefaultField.forEach(item=>{
            if(el[item.key])return
            el[item.key] = item.value
          })
          // 给xml  判断字符数组有没有 有的话删掉 并且添加到标签
          addXmlField.forEach(item => {
            if (el.name[0].includes(item)) {
              const valueArr = el.name[0].split(`${item}_`)
              el[item] = valueArr.pop().split('-')[0]
              el.name = [String(el.name[0]).replace(new RegExp(`-${item}_${el[item]}`, "g"), "")]
            }
          })
        });
        // 
        whireXML(result, el, toXmlPath)
      })
    }
  }
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
      readJson(jsonPath, toJsonPath)
    } else if (path.extname(el) === '.json') {
      const json = fs.readFileSync(jsonPath + el, 'utf8')
      const model = JSON.parse(json)
      model.shapes.forEach(el => {
        delName.forEach(item => {
          el.label = String(el.label).replace(new RegExp(item, "g"), "")
        })
      })
      whireJson(JSON.stringify(model, '', '\t'), el, toJsonPath)
    }
  }
}

try {
  readXml(xmlPath, toXmlPath)
  readJson(jsonPath, toJsonPath)
} catch (error) {
  console.log(JSON.stringify(error, '', '\t'))
  console.log('文件夹里边有不是xml或者json得文件')
}