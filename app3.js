const fs = require('fs');
var path = require('path');

let startJson = path.join(__dirname, './sumName/')
let startToJson = path.join(__dirname, './sumNameOver/')
let jsonPath = path.join(__dirname, './sumName/')
let toJsonPath = path.join(__dirname, './sumNameOver/')

if (!fs.existsSync(toJsonPath)) {
  fs.mkdirSync(toJsonPath)
}

// 地柜文件夹
function readJson(jsonPath = '', toJsonPath = '', start) {
  try {
    const ressultDir = fs.readdirSync(jsonPath)
    while (ressultDir.length) {
      let el = ressultDir.pop()
      const data = fs.statSync(jsonPath + el)
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
        const name = path.basename(el, '.json')
        fs.appendFile(path.join(toJsonPath, '1.json'), '"' + name + '",', 'utf8', err1 => {
          if (err1) {
            throw err1;
          }
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