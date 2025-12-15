"use client"

import React, { useState } from 'react';
import styles from './loginsignupform.module.scss'
import Link from 'next/link';
import { userLogin, userRegister } from '@/src/lib/auth/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/src/hooks/ui/ToastProvider/ToastProvider';
import Loader from '../../ui/loader/Loader';


const LoginSignupForm = ({variant = "primary"}) => {
  const router = useRouter();
  const {success,error:toastError} = useToast()
  const[form,setForm] = useState({email:"",name:"",password:""})
  const [loading,setLoading] = useState(false)
  const[error,setError] = useState<string | null>(null)
  const [ok,setOk] = useState(false)

  const onSignup = async(e:React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setOk(false)
    try {
      const res = await userRegister(form)
      if(res.ok) {
        success("🎉 Account created successfully!") 
        router.replace('/login')
        return;
      }if (res.message === "Already registered please login"){
        toastError(res.message || "Registration failed");
        router.replace('/login')}
    } catch (error:any) {
      toastError("Registration failed");
    }finally{
      setLoading(false)
    }

  }

  const onSignin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const res = await userLogin({
      email: form.email,
      password: form.password
    })

    if (!res.ok) {
      toastError(res.message || 'Wrong Email or Password')
      return
    }

    localStorage.setItem('token', res.token)
    success('🎉 Logged in successfully!')
    router.replace('/')
  } catch (err: any) {
    toastError(err.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className={styles.topform}>
        {variant === "primary" ? <h1 className={styles.formhd}>Welcome Back</h1> : <h1 className={styles.formhd}>Get Started</h1> }

        <form>
        <div className={styles.email}>
          <label className={styles.emaillabel} htmlFor="email">Email</label>
          <input className={styles.emailinput} type='email' id='email' name='email' placeholder='you@example.com' required
          onChange={(e) => {setForm({...form,email:e.target.value})}}/>
        </div>
        {variant === "secondary" && <div className={styles.email}>
          <label className={styles.emaillabel} htmlFor="email">Username</label>
          <input className={styles.emailinput} type='email' id='email' name='email' placeholder='your_username' required
          onChange={(e) => {setForm({...form,name:e.target.value})}}/>
        </div>}
        <div className={styles.email}>
          <label className={styles.emaillabel} htmlFor="email">Password</label>
          <input className={styles.emailinput} type='password' id='email' name='email' placeholder='Enter_your_password' required
          onChange={(e) => {setForm({...form,password:e.target.value})}}/>
        </div>

        </form>

        {variant === "primary" ? 
        <button className={styles.btnform} onClick={onSignin} disabled={loading}>{loading ? <Loader/> : "Sign In"}</button> 
        : <button className={styles.btnform} onClick={onSignup} disabled={loading}>{loading ? <Loader/> :"Sign Up"}</button>}
        {variant === "primary" ? 
        <div className={styles.formtext}>Don't have an account?<Link href={'/signup'}> Sign Up</Link></div> :
        <div className={styles.formtext}>Already have an account?<Link href={'/login'}> Log In</Link></div> 
        }
    </div>
  )
}

export default LoginSignupForm;