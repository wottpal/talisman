import { AccountJsonAny } from "@core/domains/accounts/types"
import { useOpenClose } from "@talisman/hooks/useOpenClose"
import downloadJson from "@talisman/util/downloadJson"
import { provideContext } from "@talisman/util/provideContext"
import { api } from "@ui/api"
import { useCallback, useEffect, useMemo } from "react"
import { yupResolver } from "@hookform/resolvers/yup"
import { FormField } from "@talisman/components/Field/FormField"
import { Modal } from "@talisman/components/Modal"
import { ModalDialog } from "@talisman/components/ModalDialog"
import { PasswordStrength } from "@talisman/components/PasswordStrength"
import { useForm } from "react-hook-form"
import styled from "styled-components"
import { Button } from "talisman-ui"
import * as yup from "yup"
import { PasswordUnlock, usePasswordUnlock } from "./PasswordUnlock"
import { useSelectedAccount } from "../Portfolio/SelectedAccountContext"

const EXPORTABLE_ORIGINS = ["SEED", "JSON", "DERIVED"]

export const useAccountExportModalProvider = () => {
  const { account } = useSelectedAccount()
  const { isOpen, open, close } = useOpenClose()

  useEffect(() => {
    close()
  }, [account, close])

  const canExportAccount = useMemo(
    () => account && EXPORTABLE_ORIGINS.includes(account?.origin as string),
    [account]
  )

  const exportAccount = useCallback(
    async (password: string, newPw: string) => {
      if (!account) return
      const { exportedJson } = await api.accountExport(account.address, password, newPw)
      downloadJson(exportedJson, `${exportedJson.meta?.name || "talisman"}`)
    },
    [account]
  )

  return { account, canExportAccount, exportAccount, isOpen, open, close }
}

export const [AccountExportModalProvider, useAccountExportModal] = provideContext(
  useAccountExportModalProvider
)

type FormData = {
  newPw: string
  newPwConfirm: string
}

const schema = yup
  .object({
    newPw: yup.string().required("").min(6, "Password must be at least 6 characters long"),
    newPwConfirm: yup
      .string()
      .required("")
      .oneOf([yup.ref("newPw")], "Passwords must match!"),
  })
  .required()

const ExportAccountForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { canExportAccount, exportAccount } = useAccountExportModal()
  const { password } = usePasswordUnlock()
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    watch,
    setError,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: yupResolver(schema),
  })

  const newPwWatch = watch("newPw")

  const submit = useCallback(
    async ({ newPw }: FormData) => {
      if (!password) return
      try {
        await exportAccount(password, newPw)
        onSuccess && onSuccess()
      } catch (err) {
        setError("newPwConfirm", {
          message: (err as Error)?.message ?? "",
        })
      }
    },
    [exportAccount, setError, onSuccess, password]
  )

  if (!canExportAccount || !password) return null
  return (
    <div>
      <form onSubmit={handleSubmit(submit)}>
        <p className="text-body-secondary my-8 text-sm">
          Set a password for your JSON export. We strongly suggest using a{" "}
          <span className="text-white">different password</span> from your Talisman wallet password.
          This avoids exposing your Talisman password to other wallets or applications.
        </p>

        <div className="mt-12">
          <div className="text-body-disabled mb-8 text-sm">
            Password strength: <PasswordStrength password={newPwWatch} />
          </div>
          <FormField error={errors.newPw} className="mb-12">
            <input
              {...register("newPw")}
              autoFocus={true}
              placeholder="Enter New Password"
              spellCheck={false}
              autoComplete="new-password"
              data-lpignore
              type="password"
              tabIndex={2}
            />
          </FormField>
          <FormField error={errors.newPwConfirm} className="mb-12">
            <input
              {...register("newPwConfirm")}
              placeholder="Confirm New Password"
              spellCheck={false}
              autoComplete="off"
              data-lpignore
              type="password"
              tabIndex={3}
            />
          </FormField>
        </div>
        <Button
          className="mt-12"
          type="submit"
          primary
          fullWidth
          disabled={!isValid}
          processing={isSubmitting}
        >
          Export
        </Button>
      </form>
    </div>
  )
}

const Dialog = styled(ModalDialog)`
  width: 50.3rem;
`

export const AccountExportModal = () => {
  const { isOpen, close } = useAccountExportModal()
  return (
    <Modal open={isOpen} onClose={close}>
      <Dialog title="Export account JSON" onClose={close}>
        <PasswordUnlock
          description={
            <div className="text-body-secondary mb-8">
              Please confirm your password to export your account.
            </div>
          }
        >
          <ExportAccountForm onSuccess={close} />
        </PasswordUnlock>
      </Dialog>
    </Modal>
  )
}
