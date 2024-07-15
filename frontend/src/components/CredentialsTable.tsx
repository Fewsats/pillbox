import { useNavigate } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './catalyst/table'

interface CredentialsTableProps {
  credentials: any[] | null;
}

export function CredentialsTable({ credentials }: CredentialsTableProps) {
  const navigate = useNavigate()

  const handleRowClick = (id: string) => {
    navigate(`/credentials/${id}`)
  }

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
  }

  return (
    <div className="mt-8">
      <Table className="w-full">
        <TableHead>
          <TableRow>
            <TableHeader>ID</TableHeader>
            <TableHeader>URL</TableHeader>
            <TableHeader className="hidden lg:table-cell">Macaroon</TableHeader>
            <TableHeader className="hidden lg:table-cell">Preimage</TableHeader>
            <TableHeader>Created at</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {credentials?.map((credential) => (
            <TableRow 
              key={credential.id} 
              onClick={() => handleRowClick(credential.id.toString())}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="truncate" title={credential.id}>
                  {truncateText(credential.id, 8)}
                </div>
              </TableCell>
              <TableCell>
                <div className="truncate" title={credential.location}>
                  <span className="lg:hidden">{truncateText(credential.location, 20)}</span>
                  <span className="hidden lg:inline">{truncateText(credential.location, 40)}</span>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="truncate" title={credential.macaroon}>
                  {truncateText(credential.macaroon, 15)}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="truncate" title={credential.preimage}>
                  {truncateText(credential.preimage, 15)}
                </div>
              </TableCell>
              <TableCell>
                <div className="truncate" title={new Date(credential.created_at).toLocaleString()}>
                  {new Date(credential.created_at).toLocaleDateString()}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}