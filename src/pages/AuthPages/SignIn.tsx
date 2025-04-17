import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Kwala WhatsApp Sender Login | Kwala - Whatsapp Sender"
        description="This is Kwala WhatsApp Sender"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
