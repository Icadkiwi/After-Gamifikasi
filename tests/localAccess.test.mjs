import test from 'node:test'
import assert from 'node:assert/strict'
import { canUseLocalAccess, getLocalUser } from '../src/lib/localAccess.ts'
import { isAdminEmail } from '../src/utils/admin.ts'

test('local access requires both development mode and an exact loopback hostname', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]', '::1']) {
    assert.equal(canUseLocalAccess(true, host), true)
    assert.equal(canUseLocalAccess(false, host), false)
  }
  for (const host of ['', 'localhost.example.com', '192.168.1.2', 'example.com', '127.0.0.1.example.com']) {
    assert.equal(canUseLocalAccess(true, host), false)
  }
})

test('preview identities have separate storage owners and cannot match the Firebase admin whitelist', () => {
  const admin = getLocalUser('admin')
  const user = getLocalUser('user')
  assert.notEqual(admin.uid, user.uid)
  assert.equal(isAdminEmail(admin.email), false)
  assert.equal(isAdminEmail(user.email), false)
})
