'use client'

import { useEffect,useState } from 'react'
import { useParams } from 'next/navigation'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function CourseBuilder(){

  const params = useParams()
  const courseId = params.courseId as string

  const [course,setCourse]=useState<any>(null)
  const [sectionTitle,setSectionTitle]=useState('')
  const [lessonTitle,setLessonTitle]=useState('')
  const [videoFile,setVideoFile]=useState<File|null>(null)
  const [activeSection,setActiveSection]=useState<string|null>(null)

  useEffect(()=>{
    loadCourse()
  },[])

  const loadCourse=async()=>{
    try{
      const res=await adminApi.getCourse(courseId)
      setCourse(res.data.data)
    }catch(err){
      toast.error("Failed to load course")
    }
  }

  const addSection=async()=>{
    if(!sectionTitle) return
    try{
      await adminApi.createSection(courseId,{
        title:sectionTitle,
        order:(course.sections?.length || 0)+1
      })
      setSectionTitle('')
      toast.success("Section Created")
      loadCourse()
    }catch{
      toast.error("Failed to create section")
    }
  }

  const createLesson=async()=>{
    if(!lessonTitle || !activeSection) return
    try{
      const lessonRes=await adminApi.createLesson(activeSection,{
        title:lessonTitle,
        order:1,
        isFreePreview:true
      })
      const lessonId=lessonRes.data.data.id

      if(videoFile){
        const formData=new FormData()
        formData.append('video',videoFile)
        formData.append('lessonId',lessonId)
        formData.append('title',lessonTitle)

        // 🔴 التعديل تم هنا، ضفنا as any
        await adminApi.uploadLessonVideo(formData as any)
      }

      toast.success("Lesson Created")
      setLessonTitle('')
      setVideoFile(null)
      setActiveSection(null)
      loadCourse()
    }catch(err){
      console.log(err)
      toast.error("Failed to create lesson")
    }
  }

  return(
    <div style={{padding:40,color:'white'}}>
      <h1>{course?.title}</h1>

      {course?.sections?.map((section:any)=>(
        <div key={section.id} style={{marginBottom:30}}>
          <h2>
            {section.title}
            <button
              style={{marginLeft:10}}
              onClick={()=>setActiveSection(section.id)}
            >
              + Lesson
            </button>
          </h2>

          {section.lessons?.map((lesson:any)=>(
            <div key={lesson.id} style={{marginLeft:20}}>
              📺 {lesson.title}
            </div>
          ))}
        </div>
      ))}

      <hr/>

      <h3>Add Section</h3>
      <input
        value={sectionTitle}
        onChange={(e)=>setSectionTitle(e.target.value)}
        placeholder="Section name"
      />
      <button onClick={addSection}>
        Add Section
      </button>

      {activeSection && (
        <>
          <hr/>
          <h3>Add Lesson</h3>
          <input
            value={lessonTitle}
            onChange={(e)=>setLessonTitle(e.target.value)}
            placeholder="Lesson title"
          />
          <br/><br/>
          <input
            type="file"
            accept="video/*"
            onChange={(e)=>setVideoFile(e.target.files?.[0]||null)}
          />
          <br/><br/>
          <button onClick={createLesson}>
            Create Lesson
          </button>
        </>
      )}
    </div>
  )
}