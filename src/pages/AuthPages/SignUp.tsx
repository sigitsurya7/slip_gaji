import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Kwala WhatsApp Sender Login | Kwala - Whatsapp Sender"
        description="This is Kwala WhatsApp Sender"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
