import Field from "@talisman/components/Field"
import { classNames } from "@talismn/util"
import { api } from "@ui/api"
import useMnemonicBackup from "@ui/hooks/useMnemonicBackup"
import { useEffect, useState } from "react"
import styled from "styled-components"

import { Mnemonic } from "./Mnemonic"
import { PasswordUnlock, usePasswordUnlock } from "./PasswordUnlock"

const Description = () => (
  <div className="text-body-secondary text-md my-12">
    <p>
      Your recovery phrase gives you access to your wallet and funds. It can be used to restore your
      Talisman created accounts if you lose access to your device, or forget your password.
    </p>
    <p className="mt-[1em]">
      We strongly encourage you to back up your recovery phrase by writing it down and storing it in
      a secure location.{" "}
      <a
        href="https://docs.talisman.xyz/talisman/navigating-the-paraverse/account-management/back-up-your-secret-phrase"
        target="_blank"
        className="text-body opacity-100"
      >
        Learn more.
      </a>
    </p>
  </div>
)

type MnemonicFormProps = {
  className?: string
}

const MnemonicForm = ({ className }: MnemonicFormProps) => {
  const { isConfirmed, toggleConfirmed } = useMnemonicBackup()
  const [mnemonic, setMnemonic] = useState<string>()
  const { password } = usePasswordUnlock()

  useEffect(() => {
    if (!password) return
    api.mnemonicUnlock(password).then((result) => setMnemonic(result))
  }, [password])

  return (
    <div className={classNames("flex grow flex-col", className)}>
      {mnemonic ? (
        <>
          <Mnemonic mnemonic={mnemonic} />
          <div className="grow"></div>
          <Field.Toggle
            className="toggle"
            info="I've backed it up"
            value={isConfirmed}
            onChange={(val: boolean) => toggleConfirmed(val)}
          />
        </>
      ) : (
        <div className="bg-grey-800 mt-[32.8px] h-72 w-full animate-pulse rounded"></div>
      )}
    </div>
  )
}

const StyledMnemonicForm = styled(MnemonicForm)`
  .toggle {
    flex-direction: row;
    justify-content: flex-end;
  }
`

const WrappedMnemonicForm = ({ className }: MnemonicFormProps) => {
  return (
    <div className={classNames("flex h-[50rem] flex-col", className)}>
      <Description />
      <PasswordUnlock
        className="flex w-full grow flex-col justify-center"
        buttonText="View Recovery Phrase"
        title="Enter your password to show your recovery phrase."
      >
        <StyledMnemonicForm />
      </PasswordUnlock>
    </div>
  )
}

export default WrappedMnemonicForm
