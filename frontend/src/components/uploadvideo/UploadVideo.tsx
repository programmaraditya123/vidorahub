'use client'
import React,{useState,useRef,useCallback} from 'react'
import VidorahubIcon from '@/src/icons/VidorahubIcon'
import styles from '../../../app/page.module.css'
import { uploadVideo } from '@/src/lib/video/uploadvideo'

const ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-matroska",
    "video/x-msvideo"
]
type Props = {
  onFileReady?: (file: File) => void
}

const MAX_SIZE_MB = 1024;

export default function UploadVideo({onFileReady} : Props){
    const [dragActive,setDragActive] = useState<boolean>(false);
    const [file,setFile] = useState<File | null>(null);
    const [error,setError] = useState<string | null>(null);
    const handleInputRef = useRef<HTMLInputElement | null>(null);
    const [title,setTitle] = useState<string | null>("");
    const [description,setDiscription] = useState<string | null>("");
    const [tags,setTags] = useState<string>("");
    const[loading,setLoading] = useState<boolean>(false)

    //check selected file
    const validateFile = (f : File) => {
        if(!ALLOWED_VIDEO_TYPES.includes(f.type)){
            return "Unsupported file format.Please Upload Video (mp4,mov,mkv)";
        }
        const sizeMB = f.size / (1024*1024);
        if(sizeMB > MAX_SIZE_MB){
            return `File is too large.Max Allowed is ${MAX_SIZE_MB}MB`
        }
        return;
    };

    //function called when user picked or dropped file
    const handlefile = useCallback((f : File) => {
        const validationError = validateFile(f)
        if(validationError){
            setError(validationError)
            setFile(null)
            return;
        }
        setError(null);
        setFile(f)
        onFileReady?.(f)
    },[])

    //Drag and drop handling functions
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if(!dragActive) setDragActive(true)
    };

    const onDragLeave = (e : React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
    };

    const onDrop = (e : React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation()
        setDragActive(false)
        const dt = e.dataTransfer;
        if(!dt || !dt.files || dt.files.length === 0) return;
        const f = dt.files[0];
        handlefile(f)
    };

    //function to open computer files and folders
    const openPicker = () => handleInputRef.current?.click();

    //enter/space trigger to open file picker
    const onDropKeyDown = (e : React.KeyboardEvent<HTMLDivElement>) => {
        if(e.key === "Enter" || e.key === " "){
            e.preventDefault();
            openPicker()
        }
    };

    //handle hidden input change
    const onInputChange = (e : React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if(f) handlefile(f);
        e.currentTarget.value = "";


    }

    const handlePublish = async () => {
        try {
            setLoading(true)
            if(!file){
                console.log("No file selected")
                setLoading(false)
                return;

            }
            if(!title){
                console.log("Please enter title")
                setLoading(false)
                return;
            }
            if(!description){
                console.log("Please enter description")
                setLoading(false)
                return;
            }
            if(!tags){
                console.log("Please enter tags")
                setLoading(false)
                return;
            }
        const upload = await uploadVideo({file,title,description,tags})
        setLoading(false)
        return upload
            
        } catch (error) {
            setLoading(false)
            console.log(error,"failed to upload video")
            
        }
        
    }



    return(
        <div className={styles.topcontainer}>
            <div className={styles.innercontainer}>
                <h1 className={styles.toptext}>{loading ? "Video is Uploading" : "Upload Your Video"}</h1>
           
            <div className={styles.upload}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick = {openPicker}
            onKeyDown ={onDropKeyDown}
            
            >
                <div className={styles.uploadicon}><VidorahubIcon.FileIcon/></div>
                <div className={styles.uploadtext}>Drag & Drop your video file here</div>
                <div className={styles.uploadtext2}>or click to browse</div>
                <button className={styles.selectbtn} onClick={(e) => {
                    e.stopPropagation()
                    openPicker()
                }}>Select file</button>
                <input ref={handleInputRef} type='file' onChange={onInputChange} style={{display:'none'}}/>
                <div style={{ marginTop: 12 }}>
                    {error && <div style={{ color: 'red' }}>{error}</div>}
                    {file && (
                        <div>
                        <strong>Selected:</strong> {file.name} — {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                    )}
                    </div>
            </div>
            <div className={styles.innercontainer2}>
                 <div className={styles.email1}>
                          <label className={styles.emaillabel1} htmlFor="title">Title(required)</label>
                          <input className={styles.emailinput1} type='text' id='title' name='title' placeholder='Enter Video Title' required
                           onChange={(e) => setTitle(e.target.value)}/>
                    </div>
                 <div className={styles.email1}>
                          <label className={styles.emaillabel1} htmlFor="description">Description</label>
                          <textarea className={styles.emailinput1}  id='description' name='description' placeholder='Enter Video Description' required
                           onChange={(e) => setDiscription(e.target.value)}/>
                    </div>
                 <div className={styles.email1}>
                          <label className={styles.emaillabel1} htmlFor="tags">Tags</label>
                          <input className={styles.emailinput1} type='text' id='tags' name='tags' placeholder='Enter Your Tags in comma separated' required
                           onChange={(e) => setTags(e.target.value)}/>
                    </div>
                    <hr className={styles.hrline}/>
                    <div className={styles.uploadbutton}>
                          <button className={styles.publishbtn} onClick={handlePublish}>Publish</button>

                    </div>

                  

            </div>
             </div>
        </div>
    )

}