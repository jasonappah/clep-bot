// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend';

type Data = {
  error: string
} | {
  data: any
  found: string[]
  time: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (!req.query.key || req.query.key !== process.env.KEY) {
    console.log({ key: req.query.key, env: process.env.KEY })
    return res.status(401).json({ error: "Unauthorized" })
  }
  const days = ["2023-08-16", "2023-08-17", "2023-08-18"]

  // TODO: ensure CDT always
  const timeZone = 'America/Chicago'
  const time = new Date(new Date().toLocaleString("en-US", { timeZone })).toISOString()

  const promises = days.map((d) => fetch(`https://testing.verificient.com/614e76646a47455568375419/api/v-2/scheduler/available/slots/?selected_date=${d}T05:00:00.000Z&test_uuid=4a0bd817d11b4f5aa5bf4b2cec3cf1ba&localtime=${time}`, {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "sec-ch-ua": "\"Not/A)Brand\";v=\"99\", \"Microsoft Edge\";v=\"115\", \"Chromium\";v=\"115\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-csrftoken": "REDACTED",
      "cookie": "REDACTED",
      "Referer": "https://testing.verificient.com/614e76646a472c210d255003/tests/list/all/new/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": null,
    "method": "GET"
  }))

  const responses = await Promise.all(promises)
  const data = await Promise.all(responses.map((r) => r.json())) as { slots: string[], local_tz: string }[]
  const found = data.reduce((acc, cur, idx) => {
    if (cur.slots.length > 0) {
      acc.push(...cur.slots.map((s) => `${days[idx]} ${s}`))
    }
    return acc
  }, [] as string[])

  console.log({ time, found, data })

  if (found.length > 0) {
    const resend = new Resend(process.env.RESEND_KEY as string);
    const email = {
      from: 'clep@rs.jasonaa.me',
      to: 'jasonantwiappah@gmail.com',
      subject: 'Found an appointment',
      text: 'go go go found appt\n' + found.join('\n')
    }
    await resend.emails.send(email);
    console.log({ time, email })
  }

  res.status(200).json({ time, data, found })
}
