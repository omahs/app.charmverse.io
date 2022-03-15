import { Autocomplete, Box, TextField } from '@mui/material';
import { CryptoCurrencies } from 'connectors';
import { CryptoCurrency, CryptoCurrencyList, CryptoLogoPaths } from 'models/Currency';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { ITokenMetadata, getPaymentMethod, getTokenInfo } from 'lib/tokens/tokenData';
import { PaymentMethod } from '@prisma/client';

export interface IInputSearchCryptoProps {
  onChange?: (value: CryptoCurrency) => any,
  defaultValue?: CryptoCurrency | string,

  cryptoList?: Array<string | CryptoCurrency>
}

export function InputSearchCrypto ({
  onChange = () => {},
  defaultValue,
  cryptoList = CryptoCurrencies
}: IInputSearchCryptoProps) {

  const valueToDisplay = defaultValue ?? (cryptoList[0] ?? '');

  const [inputValue, setInputValue] = useState('');

  const [value, setValue] = useState(valueToDisplay);

  const [paymentMethods] = usePaymentMethods();

  useEffect(() => {
    console.log('Use effect triggered');
    setInputValue(valueToDisplay);
    setValue(valueToDisplay);
  }, [cryptoList]);

  function emitValue (received: string) {
    setValue(received);
    console.log('Received value to emit', received, cryptoList);
    if (received !== null && cryptoList.indexOf(received as CryptoCurrency) >= 0) {
      onChange(received as CryptoCurrency);
    }

    console.log('Current state: value', value, 'input', inputValue);
  }

  return (
    <Autocomplete
      sx={{ minWidth: 150 }}
      onChange={(_, _value) => {
        console.log('Received value', _value);
        emitValue(_value as any);
      }}
      value={value}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        console.log('New input value', newInputValue);
        setInputValue(newInputValue);
      }}
      options={cryptoList}
      disableClearable={true}
      autoHighlight
      size='small'
      getOptionLabel={(option) => {
        const tokenInfo = getTokenInfo(paymentMethods, option);
        return tokenInfo.tokenSymbol;
      }}
      renderOption={(props, option) => {

        const tokenInfo = getTokenInfo(paymentMethods, option);

        return (
          <Box component='li' sx={{ '& > img': { mr: 2, flexShrink: 0 }, display: 'flex', gap: 1 }} {...props}>
            {
              tokenInfo.tokenLogo && (
                tokenInfo.isContract ? (
                  <img
                    loading='lazy'
                    width='20px'
                    height='20px'
                    src={tokenInfo.tokenLogo}
                    alt='Crypto logo'
                  />
                ) : (
                  <Image
                    loading='lazy'
                    width='20px'
                    height='20px'
                    src={tokenInfo.tokenLogo}
                  />
                )
              )
            }

            <Box component='span'>
              {tokenInfo.tokenSymbol}
            </Box>
            <Box component='span'>
              {tokenInfo.tokenName}
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
        />
      )}
    />
  );
}

