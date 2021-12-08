const fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var parseString = require('xml2js').parseString;
let jsonPath = path.join(__dirname, './json')
let toJsonPath = path.join(__dirname, './tojson')
if (!fs.existsSync(jsonPath)) {
  fs.mkdirSync(jsonPath)
}
if (!fs.existsSync(toJsonPath)) {
  fs.mkdirSync(toJsonPath)
}

// 地柜文件夹
function readJson(jsonPath = '', toJsonPath = '') {
  try {
    const ressultDir = fs.readdirSync(jsonPath)
    while (ressultDir.length) {
      let el = ressultDir.pop()
      const data = fs.statSync(jsonPath +'\\'+ el)
      if (data.isDirectory()) {
        jsonPath = path.join(jsonPath, el, '\\')
        toJsonPath = path.join(toJsonPath, el, '\\')
        if (!fs.existsSync(toJsonPath)) {
          fs.mkdirSync(toJsonPath)
        }
        readJson(jsonPath, toJsonPath)
        let jsonPathOver = jsonPath.split('\\')
        jsonPathOver.pop()
        jsonPathOver.pop()
        jsonPath = jsonPathOver.join('\\') + '\\'
        let toJsonPathOver = toJsonPath.split('\\')
        toJsonPathOver.pop()
        toJsonPathOver.pop()
        toJsonPath = toJsonPathOver.join('\\') + '\\'
        console.log(`${toJsonPath}书写完毕`)
      } else if (path.extname(el) === '.json') {
        const url = path.join(jsonPath,el)
        fs.readFile(url,'utf8',(err,data)=>{
          if(err){
            console.log(err)
            return
          }
          const result = JSON.parse(data)
          delete result.fillColor
          delete result.imageData
          delete result.lineColor
          delete result.imgAttrLabel
          const xmlUrl = el.split('.')
          xmlUrl.pop()
          parseString(fs.readFileSync(path.join(jsonPath, xmlUrl.join('') + '.xml'), 'utf8'), (err, xml) => {
            const {width,height } = xml.annotation.size[0]
            result.imageWidth=width[0]
            result.imageHeight=height[0]
            result.shapes.forEach(el => {
              delete el.line_color
              delete el.fill_color
            });
            fs.writeFile(path.join(toJsonPath,el),JSON.stringify(result,'', '\t'),'utf8',(err)=>{
              if(err){
                console.log(err)
                return
              }
              console.log('转换完成'+el)
            })
          })
        })
      }
    }
  } catch (error) {
    console.log(error)
  }
}

readJson(jsonPath, toJsonPath, true)

// SELECT
// 	file_name,
// 	file_oss_url,
// 	file_path,
// 	oss_upload_state,
// 	material_type_code,
// 	data_set_id,
// 	data_file_size,
// 	creation_time,
// 	isdelete 
// FROM
// 	`vegas_data_set_data` 
// WHERE
// 	data_set_id IN ( ) 
// 	AND SUBSTRING_INDEX( file_name, '.', 1 ) IN ()