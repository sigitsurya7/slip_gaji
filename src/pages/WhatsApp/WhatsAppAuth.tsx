import { useEffect, useState } from "react";
import axios from "axios";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { MdOutlineSend } from "react-icons/md"

export default function WhatsAppAuth() {
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await axios.get("http://localhost:3001/qr");
        if (res.data.qr) {
          setImg(res.data.qr);
          setSuccess(false);
        } else if (res.data.message === "Sudah terautentikasi") {
          setSuccess(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQR();
  }, []);

  return (
    <>
      <PageMeta
        title="Kwala Whatsapp Sender - Auth"
        description="Kwala Whatsapp Sender Auth Page"
      />

      <div className="grid grid-cols-2 gap-4">
        
        <div className="rounded-2xl border border-gray-200 bg-gray-100 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-center h-full bg-white p-4 rounded-xl border boder-gray-200 dark:border-white/[0.05] dark:bg-white/[0.05]">
                {loading ? (
                <p>Loading...</p>
                ) : success ? (
                <div className="font-semibold text-lg dark:text-white">
                    ✅ Sudah terautentikasi dengan WhatsApp!
                </div>
                ) : img ? (
                <div className="text-center">
                    <p className="mb-4">Scan kode QR di bawah ini dengan WhatsApp:</p>
                    <img src={img} alt="QR Code" className="w-60 h-60 mx-auto" />
                </div>
                ) : (
                <p>QR tidak tersedia atau belum diinisialisasi.</p>
                )}
            </div>
        </div>

        <div className="rounded-2xl border border-gray-200 p-1 h-max bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col">
                <div className="space-y-6 bg-white p-4 rounded-2xl border boder-gray-200">
                    <div>
                        <Label>
                            Nomor Tlp <span className="text-error-500">*</span>{" "}
                        </Label>
                        <Input placeholder="Cth. 628123456789" />
                    </div>
                    <div>
                        <Label>
                            Isi Pesan <span className="text-error-500">*</span>{" "}
                        </Label>
                        <TextArea placeholder="Cth. Hai Apakabar?" />
                    </div>

                </div>
                <div className="flex justify-end p-4">
                    <Button
                        startIcon={<MdOutlineSend className="size-5" />}
                    >
                        Kirim Pesan~
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
