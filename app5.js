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
const classConfig = ['','人','足球','篮球','排球']

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
          delete result.flags
          delete result.lineColor
          delete result.imgAttrLabel
          delete result.version
          const xmlUrl = el.split('.')
          xmlUrl.pop()
          parseString(fs.readFileSync(path.join(jsonPath, xmlUrl.join('') + '.xml'), 'utf8'), (err, xml) => {
            const {width,height } = xml.annotation.size[0]
            result.imageWidth=Number(width[0])
            result.imageHeight=Number(height[0])
            let groupsId = 0
            const rectResult = result.shapes.filter(el=>el.shape_type==='rectangle').map(el=>{
              groupsId++
              const classIndex  = classConfig.findIndex(item=>item===el.label)
              if(classIndex===-1) throw new Error(path.join(jsonPath, xmlUrl.join('')+el.label+'矩形 label 不正确'))
              const  points = el.points
              return {
                group_id:groupsId,
                class:Number(classIndex),
                bbox:[points[0][0],points[0][1],points[1][0]-points[0][0],points[1][1]-points[0][1]],
                keypoints:[],
                segments:[],
                needKeypoints:classIndex===1
              }
            })
            const peoplePoint = result.shapes.filter(el=>el.shape_type!=='rectangle').map(el=>{
              let label=null
              const hasPoint = el.label.includes('点序号_')
              if(hasPoint){
                label = Number(el.label.split('点序号_')[1].split('-')[0])
                if(!Number.isInteger(label))throw new Error(path.join(jsonPath, xmlUrl.join('')+el.label+'点label 不正确'))
              }
              return {
                needDel:el.label.includes('完全不可见点'),
                label,
                visibility:el.label.includes('不可见点')?0:1,
                points:el.points[0]
              }
            }).filter(el=>!el.needDel)
            peoplePoint.forEach(el=>{
              delete el.needDel
            })
            const peopleIndex = rectResult.findIndex(el=>el.needKeypoints)
            rectResult[peopleIndex].keypoints = peoplePoint
            rectResult.forEach(el => {
              delete el.needKeypoints 
            });
            result.groups = rectResult
            delete result.shapes

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