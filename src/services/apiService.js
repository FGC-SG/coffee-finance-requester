import { supabase } from '../supabaseClient.js'

const NOTIFY_URL = import.meta.env.VITE_NOTIFICATION_FUNCTION_URL

function normalizeAction(a) {
  return {
    id:            a.id,
    requestId:     a.request_id,
    approverEmail: a.approver_email,
    approverName:  a.approver_name,
    approverOrder: a.approver_order,
    action:        a.action,
    comment:       a.comment || '',
    actionDate:    a.action_date || '',
  }
}

function normalizeRequest(r) {
  return {
    id:             r.id,
    title:          r.title,
    bodyMessage:    r.body_message,
    requesterEmail: r.requester_email,
    requesterName:  r.requester_name,
    approvers:      Array.isArray(r.approvers_json) ? r.approvers_json : (JSON.parse(r.approvers_json || '[]')),
    approvalType:   r.approval_type,
    status:         r.status,
    attachmentUrl:  r.attachment_url  || '',
    attachmentName: r.attachment_name || '',
    createdDate:    r.created_at      || '',
    actions:        (r.actions || []).map(normalizeAction),
  }
}

/** Get only the current user's own requests (RLS: requester_id = auth.uid()) */
export async function getRequests() {
  const { data, error } = await supabase
    .from('requests')
    .select('*, actions(*)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(normalizeRequest)
}

/** Get ALL requests across all requesters — for the "All Requests" tab */
export async function getAllRequests() {
  const { data, error } = await supabase
    .from('requests')
    .select('*, actions(*)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(normalizeRequest)
}

export async function getRequest(id) {
  const { data, error } = await supabase
    .from('requests')
    .select('*, actions(*)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return normalizeRequest(data)
}

export async function createRequest({ title, bodyMessage, approvers, approvalType }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: request, error: reqErr } = await supabase
    .from('requests')
    .insert({
      title,
      body_message:    bodyMessage,
      requester_id:    user.id,
      requester_email: user.email,
      requester_name:  user.user_metadata?.full_name || user.email,
      approvers_json:  JSON.stringify(approvers),
      approval_type:   approvalType,
    })
    .select()
    .single()

  if (reqErr) throw new Error(reqErr.message)

  const actionRows = approvers.map(a => ({
    request_id:     request.id,
    approver_email: a.email,
    approver_name:  a.displayName || a.email,
    approver_order: a.order,
    action:         'Pending',
    comment:        '',
  }))
  const { error: actErr } = await supabase.from('actions').insert(actionRows)
  if (actErr) throw new Error(actErr.message)

  fetch(NOTIFY_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ type: 'new-request', request: normalizeRequest(request), requestId: request.id }),
  }).catch(() => {})

  return normalizeRequest(request)
}
