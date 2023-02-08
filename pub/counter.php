<?php

namespace bitcoinlift;

class Counter
{
    /** User Configuration **/

    // Log file locations/paths.
    const COUNT_FILE  = '../logs/counter.txt';
    const KEYS_FILE   = '../logs/keys.txt';

    // Use file locking?
    const USE_FLOCK   = true;

    /** End User Configuration **/

    /**
    * Class instance.
    *
    * @var  object  \SimpleCounter\Counter()
    */
    private static $instance;

    /**
    * Constructor.
    */
    private function __construct()
    {
        //
    }

    /**
    * Instantiate class instance.
    *
    * @return  object  \SimpleCounter\Counter()
    */
    public static function getInstance(): self
    {
        if (!self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }


    /**
    * We use this function to open and read/write to files.
    *
    * @param   string  $file  Filename
    * @param   string  $mode  Mode (r, w, a, etc..)
    * @param   string  $data  If writing to the file, the data to write
    * @return  mixed
    */
    private function readWriteFile(string $file, string $mode, string $data = '')
    {
        if (!\file_exists($file) OR !\is_writable($file)) {
            throw new \Exception(\sprintf("'%s' does not exist or is not writable.", $file));
        }

        if (!($fp = \fopen($file, $mode))) {
            throw new \Exception(\sprintf("'%s' could not be opened.", $file));
        }

        $return = null;

        if (self::USE_FLOCK AND \flock($fp, LOCK_EX)) {
            if ($mode == 'r') {
                $return = \fread($fp, \filesize($file));
            } else {
                \fwrite($fp, $data);
            }
            \flock($fp, LOCK_UN);
        } else {
            if ($mode == 'r') {
                $return = \fread($fp, \filesize($file));
            } else {
                \fwrite($fp, $data);
            }
        }
        \fclose($fp);

        return $return;
    }

    /**
    * Processes the visitor (adds to count/etc. if needed) and
    * then displays current count.
    */
    public function process(int $checked_count, array $data = NULL)
    {
        $count = self::readWriteFile(self::COUNT_FILE, 'r');
        self::readWriteFile(self::COUNT_FILE, 'w', $count + $checked_count);
        if (!empty($data)) {
            self::readWriteFile(self::KEYS_FILE, 'a', json_encode($data) . "\n");
        }
        return $count;
    }
}

?>