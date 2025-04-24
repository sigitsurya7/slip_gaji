import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import toast from "react-hot-toast";
import axios from "axios";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [errors, setErrors] = useState({
    username: "",
    password: "",
  });

  const [form, setForm] = useState({
    username: '',
    password: '',
  });

  const navigate = useNavigate()

  const loginfunc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const { username, password } = form

    const newErrors = {
      username: "",
      password: "",
    };
  
    let hasError = false
  
    if (!username.trim()) {
      newErrors.username = "Form username tidak boleh kosong";
      hasError = true
    }
    if (!password.trim()) {
      newErrors.password = "Form password tidak boleh kosong";
      hasError = true
    }
  
    setErrors(newErrors);
  
    if (hasError) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500)
      return;
    }

    try {
      const response = await toast.promise(
        axios.post('http://localhost:3001/api/login', { username, password }),
        {
          loading: "🔐 Sedang login...",
          success: (res) => res.data.message || "✅ Login berhasil!",
          error: (err) => err.response?.data?.message || "❌ Terjadi kesalahan.",
        }
      )

      localStorage.setItem('token', 'trial-version')
      localStorage.setItem('nama', response.data.user.nama)
      setTimeout(() => {
        navigate("/", { replace: true })
      }, 3000)
  
    } catch (error: any) {
      console.error("Login error:", error)
    }
  }  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your username and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={loginfunc} className={isShaking ? "shake" : ""}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Username <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder="Enter your username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    error={errors.username ? true : false}
                    hint={errors.username}
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      error={errors.password ? true : false}
                      hint={errors.password}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                </div>
                <div>
                  <Button className="w-full" size="sm">
                    Sign in
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
