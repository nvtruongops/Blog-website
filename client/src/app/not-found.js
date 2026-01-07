import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      <h1 style={{
        fontSize: '96px',
        fontWeight: 'bold',
        marginBottom: '10px',
        color: '#343a40'
      }}>404</h1>
      <p style={{
        fontSize: '24px',
        marginBottom: '20px',
        color: '#6c757d'
      }}>Page Not Found</p>

      <Link href="/" style={{
        padding: '12px 24px',
        backgroundColor: '#007bff',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '5px',
      }}>
        GO TO HOME
      </Link>

      <div style={{ marginTop: '30px' }}>
        <a href="#" style={{
          display: 'block',
          marginBottom: '10px',
          color: '#007bff',
          textDecoration: 'none',
          fontSize: '18px'
        }}>Guide/Code/Owner/License</a>

        <a href="#" style={{
          color: '#007bff',
          textDecoration: 'none',
          fontSize: '18px'
        }}>Developed by [author]</a>
      </div>
    </div>
  );
}
